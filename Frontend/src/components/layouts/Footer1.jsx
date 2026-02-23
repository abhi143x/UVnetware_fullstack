import React from "react";

export default function Footer() {
  return (
    <footer className="mt-20 bg-white/5 pt-15 text-white">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-10 px-10 pb-15">
        <div className="flex flex-col">
          <h3 className="text-xl font-extrabold mb-4">UV<span className="text-blue-400">netware</span></h3>
          <p className="text-sm leading-[22px] opacity-80">
           Enterprise-grade seating infrastructure built for transport networks and large-scale event platforms.
          </p>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold mb-4 opacity-80">Product</h4>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Features
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Architecture
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            API Docs
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Pricing
          </p>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold mb-4 opacity-80">Company</h4>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            About
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Contact
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Support
          </p>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold mb-4 opacity-80">Legal</h4>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Privacy Policy
          </p>
          <p className="text-sm mb-2 opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
            Terms of Service
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 text-center py-5 text-[13px] opacity-60">
        © 2026 UVNPL SeatMatrixt. All rights reserved.
      </div>
    </footer>
  );
}
