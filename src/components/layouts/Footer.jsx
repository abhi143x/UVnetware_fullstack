import React from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaHeadset,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full mt-16 text-[#ffffff] font-['Roboto']">
      {/* Container */}
      <div className="bg-[#000000] border-t border-[#454545]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left */}
          <div>
            <h2 className="text-2xl font-black text-[#0000ee] mb-4">
              TicketBook
            </h2>

            <p className="text-sm text-[#eeeeee] font-light leading-relaxed">
              Book movie, bus, train, and event tickets instantly. Fast, secure,
              and reliable ticket booking platform for your everyday travel and
              entertainment needs.
            </p>

            {/* Social */}
            <div className="flex gap-4 mt-6">
              <div className="w-9 h-9 rounded-full border border-[#454545] bg-transparent hover:bg-[#0000ee] transition flex items-center justify-center cursor-pointer">
                <FaFacebookF className="text-sm text-[#ffffff]" />
              </div>

              <div className="w-9 h-9 rounded-full border border-[#454545] bg-transparent hover:bg-[#0000ee] transition flex items-center justify-center cursor-pointer">
                <FaTwitter className="text-sm text-[#ffffff]" />
              </div>

              <div className="w-9 h-9 rounded-full border border-[#454545] bg-transparent hover:bg-[#0000ee] transition flex items-center justify-center cursor-pointer">
                <FaLinkedinIn className="text-sm text-[#ffffff]" />
              </div>
            </div>
          </div>

          {/* Center */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-[#ffffff]">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm font-light text-[#eeeeee]">
              {[
                "Home",
                "Browse Events",
                "My Bookings",
                "Offers & Deals",
                "Privacy Policy",
              ].map((item) => (
                <li
                  key={item}
                  className="hover:text-[#0000ee] cursor-pointer transition"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div>
            <div>
              <h3 className="text-lg font-medium mb-4 text-[#ffffff]">
                Contact
              </h3>

              <ul className="space-y-3 text-sm font-light text-[#eeeeee]">
                <li className="flex items-center gap-3">
                  <FaPhoneAlt className="text-[#0000ee]" />
                  +91 98XXXXXX21
                </li>

                <li className="flex items-center gap-3">
                  <FaEnvelope className="text-[#0000ee]" />
                  support@ticketbook.com
                </li>

                <li className="flex items-center gap-3 text-[#00bfa5]">
                  <FaHeadset />
                  Available 24×7 for booking support
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="mt-5 flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm bg-transparent text-[#eeeeee] border border-[#454545] rounded-l-md outline-none focus:border-[#0000ee] font-light"
              />

              <button className="px-4 py-2 bg-[#d50000] hover:bg-[#00bfa5] text-[#eeeeee] text-sm font-medium rounded-r-md transition cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#454545] text-center py-5 text-sm text-[#eeeeee] font-light">
          © 2026 TicketBook — All Rights Reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
