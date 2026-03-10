import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className=" mt-36 bg-[#000021] w-screen"
      style={{ borderTop: "1.75px solid #000055" }}
    >
      <div className="w-full px-8 sm:px-12 flex flex-col items-center py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-3 gap-16 mb-12 w-full justify-center">
          {/* Product Column */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-lg font-bold  text-gray-900 dark:text-blue-400 mb-6">
              Product
            </h4>
            <a
              href="/features"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Features
            </a>
            <a
              href="#demo"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Demo
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Pricing
            </a>
            <a
              href="/signup"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Signup
            </a>
          </div>

          {/* Support Column */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-lg font-bold text-gray-900 dark:text-blue-400 mb-6">
              Support
            </h4>
            <a
              href="#support"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Support center
            </a>
            <a
              href="#documentation"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Documentation
            </a>
            <a
              href="#status"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Status
            </a>
          </div>

          {/* Company Column */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-lg font-bold text-gray-900 dark:text-blue-400 mb-6">
              Company
            </h4>
            <a
              href="#media"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Media kit
            </a>
            <a
              href="#team"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 mb-3"
            >
              Team
            </a>
            {/* <a
              href="/contact"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Contact
            </a> */}

            <Link
              to="/contact"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Top Border */}
        <div
          className="mb-8 w-full"
          style={{ borderTop: "1.75px solid #000055" }}
        ></div>

        {/* Bottom Center - Legal/Copyright */}
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
            © 2026 UVnetware Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#privacy"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Privacy and GDPR
            </a>
            <a
              href="#terms"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
