import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-black text-white">
      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-12 text-center">
        <div className="max-w-3xl">
          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            Make Seat Layouts Simple
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-400 mb-12 leading-relaxed">
            The simple way to design and manage seat layouts. Create structured
            layouts, organize categories, and integrate seamlessly through APIs.
            Built for modern booking platforms{" "}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 text-lg inline-block"
            >
              Get Started Today
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center gap-2 text-lg border border-gray-700 inline-flex"
            >
             
              Join Waitlist
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
