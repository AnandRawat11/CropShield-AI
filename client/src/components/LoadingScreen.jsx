import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-40 animate-pulse animation-delay-2000"></div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center p-8 bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl animate-fade-in-up max-w-sm text-center">
        
        {/* Pulsing Core Animation */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-8">
          <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-b-4 border-emerald-400 rounded-full animate-spin animation-direction-reverse opacity-70"></div>
          <div className="absolute inset-4 border-l-4 border-green-300 rounded-full animate-spin animation-duration-3000 opacity-40"></div>
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-green-400 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]"></div>
          
          {/* Leaf or Seed icon placeholder */ }
          <svg className="absolute w-8 h-8 text-white z-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        {/* Loading Text */}
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-200 mb-3 tracking-wide">
          CropShield AI
        </h2>
        
        <p className="text-gray-300 text-lg font-medium mb-1">
          Waking up systems...
        </p>
        
        <p className="text-gray-400 text-sm max-w-[250px]">
          We are initializing the Machine Learning models for precision agriculture.
        </p>

        {/* Progress Dots */}
        <div className="flex space-x-2 mt-6">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-direction-reverse { animation-direction: reverse; }
        .animation-duration-3000 { animation-duration: 3s; }
      `}} />
    </div>
  );
};

export default LoadingScreen;
