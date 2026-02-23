import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiTrendingUp,
  FiLogIn,
  FiArrowRight,
} from "react-icons/fi";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/", icon: FiHome },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: FiTrendingUp,
      isButton: true,
    },
    { name: "Features", href: "#features", icon: FiTrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-black via-black/95 to-black/90 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl">
      <div className="w-full px-12 sm:px-24 py-10 sm:py-14 flex items-center gap-8">
        {/* SECTION 1: LOGO */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tighter hover:scale-105 transition-transform duration-300">
              UV<span className="text-white">netware</span>
            </div>
          </Link>
        </div>

        {/* SECTION 2: NAVIGATION (Center) */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isButton) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="px-6 py-2.5 text-white text-lg font-bold rounded-lg bg-gradient-to-r hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 flex items-center gap-2 group hover:translate-x-1"
                >
                  {item.name}
                </Link>
              );
            }
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-white text-lg font-medium rounded-lg transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-400 group relative whitespace-nowrap"
              >
                <span>{item.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </a>
            );
          })}
        </div>

        {/* SECTION 3: AUTH BUTTONS (Right) */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-6">
          <Link
            to="/login"
            className="px-5 py-2.5 text-white text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-1  text-blue-800 text-lg font-bold rounded-lg border border-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white transition-all duration-300"
          >
            Signup
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden flex-shrink-0 ml-auto">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors duration-300 text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-t border-blue-500/20 backdrop-blur-lg">
          <div className="px-8 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.isButton) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 font-bold shadow-lg text-lg"
                  >
                    {item.name}
                  </Link>
                );
              }
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white rounded-lg hover:bg-blue-500/20 transition-colors duration-300 text-lg"
                >
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
            <div className="pt-4 border-t border-blue-500/20 space-y-2 mt-4">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-8 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-bold text-lg"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg border border-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all duration-300 font-bold text-lg"
              >
                Signup
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
