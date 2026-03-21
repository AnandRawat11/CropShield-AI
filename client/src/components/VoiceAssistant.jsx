import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, MessageCircle, ChevronLeft } from "lucide-react";
import API from "../services/api";

export default function VoiceAssistant({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("Hello 👋 I'm here to help you learn, explore new subjects, and tackle tricky questions.");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const currentAudioRef = useRef(null);
  // Track whether this is the first voice interaction this session
  const isFirstInteractionRef = useRef(true);

  useEffect(() => {
    return () => {
      stopRecording();
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    // Also kill any browser speech synthesis (robotic fallback) immediately
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = async () => {
    if (isListening) {
      stopRecording();
    } else {
      stopAudio();
      setTranscript("");
      setAiResponse("");
      setError("");
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsProcessing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(",")[1];
            await handleProcessVoice(base64Audio, "audio/webm");
          };
          reader.onerror = () => {
            setError("Failed to process audio recording.");
            setIsProcessing(false);
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setError("Microphone access denied. Please check permissions.");
      }
    }
  };

  const handleProcessVoice = async (base64Audio, mimeType) => {
    try {
      let currentLocation = null;
      if ("geolocation" in navigator) {
        try {
          currentLocation = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
              (err) => reject(err),
              { timeout: 5000 }
            );
          });
        } catch (err) {
          console.warn("Could not get location:", err);
        }
      }

      const response = await API.post("/assistant/voice", {
        audio: base64Audio,
        mimeType: mimeType,
        location: currentLocation,
        isFirstInteraction: isFirstInteractionRef.current,
      });

      if (response.data && response.data.success) {
        const result = response.data.data;
        // After first successful response, mark subsequent ones as NOT first
        isFirstInteractionRef.current = false;
        setTranscript(result.transcript);
        setAiResponse(result.reply);
        speakResponse(result.reply);
      } else {
        setAiResponse("Sorry, I couldn't process that. Please try again.");
        speakResponse("Sorry, I couldn't process that. Please try again.");
      }
    } catch (err) {
      console.error("Error querying voice assistant:", err);
      setAiResponse("I'm having trouble connecting. Try again later.");
      speakResponse("I'm having trouble connecting. Please check if backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text) => {
    stopAudio();
    const cleanText = text.replace(/[*#_`]/g, "");
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 0);

    const fetchAudio = async (sentence) => {
      try {
        const response = await API.post("/assistant/speak", { text: sentence }, { responseType: "blob" });
        return response.data;
      } catch (err) {
        return null;
      }
    };

    const speakNativeFallback = (textToSpeak) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const isHindi = /[\u0900-\u097F]/.test(textToSpeak);
        const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/[*#_`]/g, ""));
        utterance.lang = isHindi ? "hi-IN" : "en-IN";
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    };

    let nextAudioPromise = null;
    for (let i = 0; i < sentences.length; i++) {
      if (!isOpen || isListening) break;
      const audioBlob = nextAudioPromise ? await nextAudioPromise : await fetchAudio(sentences[i]);
      if (!audioBlob) { speakNativeFallback(sentences.slice(i).join(" ")); break; }
      if (i + 1 < sentences.length) nextAudioPromise = fetchAudio(sentences[i + 1]);
      else nextAudioPromise = null;
      const audioUrl = URL.createObjectURL(audioBlob);
      await new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); speakNativeFallback(sentences[i]); resolve(); };
        audio.play().catch(() => { speakNativeFallback(sentences[i]); resolve(); });
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      stopRecording();
      stopAudio();
    }
    return () => {
      document.body.style.overflow = "auto";
      stopRecording();
      stopAudio();
    };
  }, [isOpen]);

  // Blob animation configs
  const blobs = [
    // Magenta / hot-pink
    {
      color: "radial-gradient(circle at 40% 40%, #e040b0 0%, #d020c0 40%, transparent 70%)",
      size: "75%",
      initial: { top: "5%", left: "25%" },
      animate: { x: [0, -30, 25, -15, 0], y: [0, 30, -20, 15, 0] },
      duration: 16,
    },
    // Deep violet / purple
    {
      color: "radial-gradient(circle at 40% 40%, #7c3aed 0%, #6020d0 40%, transparent 70%)",
      size: "80%",
      initial: { top: "20%", left: "-5%" },
      animate: { x: [0, 35, -20, 25, 0], y: [0, -25, 30, -15, 0] },
      duration: 20,
    },
    // Soft periwinkle / blue
    {
      color: "radial-gradient(circle at 40% 40%, #93a8f0 0%, #7080e0 40%, transparent 70%)",
      size: "72%",
      initial: { bottom: "-5%", left: "15%" },
      animate: { x: [0, 20, -30, 15, 0], y: [0, -30, 20, -25, 0] },
      duration: 18,
    },
    // Lavender
    {
      color: "radial-gradient(circle at 40% 40%, #d4a0f8 0%, #b870f0 40%, transparent 70%)",
      size: "65%",
      initial: { top: "0%", right: "0%" },
      animate: { x: [0, -20, 30, -10, 0], y: [0, 20, -15, 25, 0] },
      duration: 22,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden bg-black/40 backdrop-blur-sm"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col aspect-[9/16] max-h-[90vh]"
            style={{ background: "linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 100%)" }}
          >
            {/* Top Navigation */}
            <div className="flex items-center justify-between px-6 pt-8 pb-4">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-sm border border-black/5 text-black hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-[#1A1A1A]">Voice chat</h1>
              <div className="w-10" />
            </div>

            {/* Status */}
            <div className="text-center px-6 mb-4">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#3E7BFA] font-medium text-sm"
              >
                {isListening ? "Listening..." : isProcessing ? "Just a moment..." : "Go ahead, I'm listening"}
              </motion.p>
            </div>

            {/* ── Central Orb ── */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              <div className="relative" style={{ width: 280, height: 280 }}>

                {/* Soft bottom shadow/glow */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 180,
                    height: 40,
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(140,100,255,0.35) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                />

                {/* ── Outer breathing scale ── */}
                <motion.div
                  animate={{ scale: isListening ? [1, 1.06, 1] : [1, 1.025, 1] }}
                  transition={{ duration: isListening ? 0.9 : 5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  {/* ── Sphere shell: liquid glass ── */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      overflow: "hidden",
                      // The subtle border = glass rim
                      boxShadow: [
                        "inset 0 2px 12px rgba(255,255,255,0.55)", // top inner highlight
                        "inset 0 -4px 16px rgba(120,80,200,0.25)", // bottom inner purple tint
                        "0 8px 40px rgba(100,60,200,0.28)",         // outer glow
                        "0 0 0 1.5px rgba(255,255,255,0.50)",       // glass rim
                      ].join(", "),
                    }}
                  >
                    {/* ── Base fill ── */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(145deg, #c8d4fc 0%, #b0bef8 40%, #a8b0f0 100%)",
                      }}
                    />

                    {/* ── Animated blobs (blurred = liquid look) ── */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        filter: "blur(22px)",   // key: blur makes blobs blend into liquid
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                    >
                      {blobs.map((blob, i) => (
                        <motion.div
                          key={i}
                          animate={blob.animate}
                          transition={{
                            duration: blob.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.25, 0.5, 0.75, 1],
                          }}
                          style={{
                            position: "absolute",
                            width: blob.size,
                            height: blob.size,
                            borderRadius: "50%",
                            background: blob.color,
                            ...blob.initial,
                          }}
                        />
                      ))}
                    </div>

                    {/* ── Liquid glass surface overlay ── */}
                    {/* Main frosted sheen */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 45%, transparent 70%)",
                        borderRadius: "50%",
                      }}
                    />

                    {/* Top-left primary glass highlight */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6%",
                        left: "12%",
                        width: "52%",
                        height: "36%",
                        borderRadius: "50%",
                        background: "radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.2) 50%, transparent 75%)",
                        transform: "rotate(-38deg)",
                        filter: "blur(2px)",
                      }}
                    />

                    {/* Small bright specular dot */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10%",
                        left: "18%",
                        width: "22%",
                        height: "14%",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.88)",
                        transform: "rotate(-38deg)",
                        filter: "blur(3px)",
                      }}
                    />

                    {/* Bottom-right subtle reflection */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8%",
                        right: "8%",
                        width: "28%",
                        height: "18%",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.12)",
                        filter: "blur(6px)",
                      }}
                    />

                    {/* Glass edge refraction ring (inner) */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 2,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.30)",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Listening pulse rings */}
                {isListening && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        inset: -12,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(180,100,255,0.28) 0%, transparent 70%)",
                        zIndex: 0,
                      }}
                    />
                    <motion.div
                      animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(130,80,240,0.22) 0%, transparent 70%)",
                        zIndex: 0,
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* AI Response Text */}
            <div className="px-8 py-4 min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={aiResponse + transcript}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-lg sm:text-xl font-medium text-[#1A1A1A] text-center leading-snug"
                >
                  {isListening && transcript ? `"${transcript}"` : aiResponse}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between px-8 pb-10 pt-4">
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#4D4D4D] hover:bg-gray-50 transition">
                <MessageCircle className="w-5 h-5" />
              </button>

              <div className="relative flex items-center justify-center">
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute w-16 h-16 bg-blue-500 rounded-full"
                  />
                )}
                <button
                  onClick={toggleListening}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                    isListening
                      ? "bg-[#3E7BFA] text-white"
                      : "bg-white text-[#3E7BFA] hover:bg-gray-50 border border-black/5"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : isListening ? (
                    <div className="flex gap-1 items-center h-3">
                      {[1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-white rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-black/5 text-[#4D4D4D] hover:bg-gray-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs border border-red-100 font-medium whitespace-nowrap">
                {error}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
