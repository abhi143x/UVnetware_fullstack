import React from "react";
import { Link } from "react-router-dom";
import seatPreviewImage from "../../assets/ss.png";
import videoPreview from "../../assets/homevideo.mp4";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-black via-black to-black text-white">
      <div className="morph-blob morph-blob-slow left-[-120px] top-[8%] h-96 w-96 bg-blue-500/70" />
      <div className="morph-blob morph-blob-fast morph-blob-delay right-[-140px] top-[34%] h-[26rem] w-[26rem] bg-cyan-400/65" />
      <div className="morph-blob left-[26%] bottom-[-140px] h-[24rem] w-[24rem] bg-indigo-500/60" />

      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      <div className="relative z-10">
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

          {/*  Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/login"
              className="micro-btn px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 text-lg inline-block"
            >
              Get Started Today
            </Link>
            <Link
              to="/signup"
              className="micro-btn px-8 py-3 bg-[#000021] hover:bg-[#000055] text-white font-bold rounded-lg transition-colors duration-300 inline-flex items-center gap-2 text-lg"
              style={{ border: "1.75px solid #000055" }}
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO SECTION */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-12 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              See It In{" "}
              <span className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Action
              </span>
            </h2>
          </div>

          {/* Video Container */}
          <div
            className="micro-media relative bg-[#000021] rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1.75px solid #000055" }}
          >
            <div className="aspect-video bg-black flex items-center justify-center">
              <iframe
                width="100%"
                height="100%"
                src={videoPreview}
                title="UVnetware Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* Video Description */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="micro-card text-center p-6 border border-blue-500/10 rounded-xl hover:border-blue-500/40 transition-colors duration-300">
              <h3 className="text-xl font-bold mb-3">Design</h3>
              <p className="text-gray-400">
                Intuitive drag-and-drop interface to create custom layouts
              </p>
            </div>
            <div className="micro-card text-center p-6 border border-blue-500/10 rounded-xl hover:border-blue-500/40 transition-colors duration-300">
              <h3 className="text-xl font-bold mb-3">Manage</h3>
              <p className="text-gray-400">
                Organize seats by categories and control availability
              </p>
            </div>
            <div className="micro-card text-center p-6 border border-blue-500/10 rounded-xl hover:border-blue-500/40 transition-colors duration-300">
              <h3 className="text-xl font-bold mb-3">Integrate</h3>
              <p className="text-gray-400">
                Connect seamlessly with your booking system via APIs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-500">
              Features
            </h2>
            <p className="text-xl text-white-300  leading-relaxed">
              Uv Netware enhances the seating visualization experience with
              powerful and intelligent tools.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4 text-blue-500">
                Advanced Layout Editor
              </h3>
              <p className="text-gray-400 leading-relaxed">
                From large-scale stadiums to compact spaces, our smart editor
                enables you to create seating layouts of any complexity with
                precision and control.
              </p>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4 text-blue-500">
                Enterprise-Ready Platform
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Deliver production-ready seating layouts seamlessly integrated
                with your booking platform or operational system.
              </p>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4 text-blue-500">
                SVG-Ready
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Import existing SVG-maps to continue right where you left off or
                export your Seatmap.pro drafts into an external SVG file with
                equal ease.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              to="/features"
              className="micro-btn px-10 py-4 bg-blue-500 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Try Now
            </Link>
          </div>
        </div>
      </section>
      {/* Section for image screenshot */}
      <section className="flex min-h-screen w-full items-center bg-linear-to-b from-black via-black to-black px-6 py-16 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
            Seat plan designer
          </p>
          <h3 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Design beautiful seat layouts
          </h3>
          <p className="mt-2 text-2xl font-bold text-blue-400 sm:text-3xl">
            in minutes, not days.
          </p>

          <div
            className="micro-media relative mx-auto mt-10 max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1.75px solid #000055" }}
          >
            <img
              src={seatPreviewImage}
              alt="Seat Layout Preview"
              className="w-full h-auto block"
            />
          </div>

          <div className="mt-14 space-y-6 text-center text-white">
            <p className="text-3xl font-semibold sm:text-5xl">
            Design complex venues effortlessly with us.
            </p>
            <p className="text-3xl font-semibold sm:text-5xl">
             Edit anytime, instantly see changes.
            </p>
            <p className="text-3xl font-semibold sm:text-5xl">
             No coding. Just drag & drop.
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/features"
              className="micro-btn inline-flex items-center gap-3 rounded-full bg-blue-500 px-8 py-4 text-xl font-semibold text-slate-900 shadow-lg transition-transform duration-300"
            >
              Learn more
              <span className="text-2xl leading-none">›</span>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
