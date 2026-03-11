import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="bg-[#000021] w-screen"
      style={{ borderTop: "1.75px solid #000055" }}
    >
      <div className="w-full px-8 sm:px-12 py-4 flex flex-wrap items-center justify-between gap-y-2">
        {/* Copyright */}
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
          © 2026 UVnetware Ltd. All rights reserved.
        </p>

        {/* Nav Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <a href="/features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Features</a>
          <a href="#demo" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Demo</a>
          <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Pricing</a>
          <a href="#documentation" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Docs</a>
          <a href="#status" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Status</a>
          <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Contact</Link>
        </div>

        {/* Legal */}
        <div className="flex items-center gap-x-6">
          <a href="#privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Privacy & GDPR</a>
          <a href="#terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">Terms</a>
        </div>
      </div>
    </footer>
  );
}
