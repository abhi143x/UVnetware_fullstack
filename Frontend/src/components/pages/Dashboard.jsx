import React from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900/20 to-black flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 sm:px-12">
        {/* Animated Title */}
        <div className="mb-12 animate-bounce">
          <h1 className="text-6xl sm:text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Coming Soon
          </h1>
        </div>

        {/* Subtitle with animation */}
        <div className="max-w-2xl mx-auto">
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 animate-pulse">
            Something amazing is on the way
          </p>
          <p className="text-base sm:text-lg text-gray-400 mb-12">
            We're working hard to bring you an incredible dashboard experience.
            Stay tuned!
          </p>
        </div>

        {/* Animated loader */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>

        {/* Status text */}
        <p className="text-sm text-gray-500 animate-pulse">
          Loading exciting features...
        </p>
      </div>
    </div>
  );
}
