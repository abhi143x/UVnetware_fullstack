import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] px-4">
      {/* Top Left Brand */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-xl font-semibold hover:opacity-80 transition"
      >
        <span className="text-[var(--accent)]">UV</span>netware
      </Link>

      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-6">
            Welcome to <span className="text-[var(--accent)]">UV</span>netware
          </h1>
          <p className="text-[var(--light-text)] text-sm">
            Enter your details to get started
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block mb-1 text-sm">Company Name</label>
            <input
              type="text"
              placeholder="Enter your Company name"
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] 
              focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Work Email */}
          <div>
            <label className="block mb-1 text-sm">Work Email</label>
            <input
              type="email"
              placeholder="Enter your work email address"
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] 
              focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="w-full px-3 py-2 pr-10 rounded-md bg-transparent border border-[var(--border)] 
                focus:outline-none focus:border-[var(--accent)] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text)] hover:text-[var(--text)] transition"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 text-sm">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 pr-10 rounded-md bg-transparent border border-[var(--border)] 
                focus:outline-none focus:border-[var(--accent)] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text)] hover:text-[var(--text)] transition"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={16} />
                ) : (
                  <FaEye size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-md bg-[var(--accent)] 
            hover:opacity-90 transition"
          >
            Sign Up
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 py-3">
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <span className="text-xs text-[var(--light-text)]">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 
            rounded-md border border-[var(--border)] 
            hover:bg-[#111] hover:cursor-pointer transition"
          >
            <FcGoogle size={18} />
            <span className="text-sm">Sign up with Google</span>
          </button>

          {/* Login Redirect */}
          <p className="text-center text-sm pt-2">
            Already have an account?{" "}
            <Link to="/login" className="!underline !text-[var(--accent)]">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
