import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, Volume2, User, Square } from "lucide-react";
import API from "../services/api";

export default function VoiceAssistant({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("Hi there! I am your CropShield AI guide. Ask me anything about your crops, weather, or farming advice.");
  const [error, setError] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    // Keep cleanup for stream if component unmounts
    return () => {
      stopRecording();
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
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
      stopAudio(); // Stop any currently playing audio
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
           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           
           // Convert Blob to Base64
           const reader = new FileReader();
           reader.onloadend = async () => {
               const base64Audio = reader.result.split(',')[1];
               await handleProcessVoice(base64Audio, 'audio/webm');
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
                console.warn("Could not get location for voice assistant:", err);
            }
        }

        const response = await API.post("/assistant/voice", { 
            audio: base64Audio, 
            mimeType: mimeType,
            location: currentLocation
        });
        
        if (response.data && response.data.success) {
            const result = response.data.data;
            setTranscript(result.transcript);
            setAiResponse(result.reply);
            speakResponse(result.reply);
        } else {
            setAiResponse("Sorry, I couldn't process that. Please try again.");
            speakResponse("Sorry, I couldn't process that. Please try again.");
        }
     } catch (err) {
        console.error("Error querying voice assistant:", err);
        setAiResponse("I'm having trouble connecting to my brain right now. Try again later.");
        speakResponse("I'm having trouble connecting to my brain right now. Please check if backend is running.");
     } finally {
        setIsProcessing(false);
     }
  };

  const speakResponse = async (text) => {
    stopAudio();
    
    // Text Processing: Remove markdown symbols and format text for better natural pauses
    const cleanText = text.replace(/[*#_`]/g, "");
    
    // Sentence Chunking: Split text into sentences.
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);

    const fetchAudio = async (sentence) => {
      try {
        const response = await API.post("/assistant/speak", { text: sentence }, {
          responseType: 'blob'
        });
        return response.data;
      } catch (err) {
        console.error("Failed to generate speech chunk:", err);
        return null;
      }
    };

    let nextAudioPromise = null;

    for (let i = 0; i < sentences.length; i++) {
      // If modal was closed or a new recording started, abort
      if (!isOpen || isListening) break; 
      
      // Use pre-fetched promise if available, otherwise start fetch
      const audioBlob = nextAudioPromise ? await nextAudioPromise : await fetchAudio(sentences[i]);
      
      if (!audioBlob || !isOpen || isListening) break;

      // Pre-fetch the NEXT sentence while playing the current one
      if (i + 1 < sentences.length) {
        nextAudioPromise = fetchAudio(sentences[i + 1]);
      } else {
        nextAudioPromise = null;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      
      await new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.play().catch(e => {
          console.error("Audio play failed:", e);
          resolve();
        });
      });
    }
  };

  // Prevent background scrolling when open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="w-full max-w-md bg-gray-900 border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-white font-medium">CropShield Voice Assistant</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 min-h-[250px] max-h-[400px] overflow-y-auto flex flex-col gap-4">
               
               {/* Intro / AI Response Message */}
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }} 
                 className="flex gap-3"
               >
                 <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                   <Volume2 className="w-4 h-4 text-white" />
                 </div>
                 <div className="bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-gray-700">
                   {aiResponse ? aiResponse : (
                     <div className="flex items-center gap-1 h-5">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-75"></span>
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce delay-150"></span>
                     </div>
                   )}
                 </div>
               </motion.div>

               {/* User Transcript Message */}
               {transcript && (
                 <motion.div 
                   initial={{ opacity: 0, x: 10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   className="flex gap-3 justify-end mt-2"
                 >
                   <div className="bg-green-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[85%]">
                     {transcript}
                   </div>
                 </motion.div>
               )}

               {error && (
                 <p className="text-red-400 text-xs text-center mt-4 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                   {error}
                 </p>
               )}
            </div>

            {/* Mic Button Area */}
            <div className="p-6 flex flex-col items-center justify-center border-t border-gray-800 bg-gray-800/50">
               
               <div className="relative flex items-center justify-center mb-2">
                 {/* Ripple effect when listening */}
                 {isListening && (
                   <>
                     <motion.div 
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute w-20 h-20 bg-green-500 rounded-full"
                     />
                     <motion.div 
                        animate={{ scale: [1, 1.3, 1.8], opacity: [0.5, 0.3, 0] }} 
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="absolute w-20 h-20 bg-green-400 rounded-full"
                     />
                   </>
                 )}

                 <button
                    onClick={toggleListening}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isListening 
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/50' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                    }`}
                 >
                    {isListening ? (
                       <Square className="w-6 h-6 fill-white" />
                    ) : isProcessing ? (
                       <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                       <Mic className="w-8 h-8" />
                    )}
                 </button>
               </div>
               
               <p className={`text-xs mt-3 ${isListening ? 'text-green-400 font-medium' : 'text-gray-500'}`}>
                 {isListening ? 'Listening... Tap to stop' : isProcessing ? 'Thinking...' : 'Tap to speak'}
               </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
