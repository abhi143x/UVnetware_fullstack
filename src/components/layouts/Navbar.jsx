import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

import { FiUser, FiChevronDown } from "react-icons/fi";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPhoto, setDraftPhoto] = useState("");
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncAuthState = () => {
      try {
        const rawUser = localStorage.getItem("uvnet_auth_user");
        setCurrentUser(rawUser ? JSON.parse(rawUser) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    syncAuthState();
    window.addEventListener("auth-changed", syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("auth-changed", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        setProfileOpen(false);
        setIsEditingName(false);
        setIsEditingPhoto(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setDraftName(currentUser.username || currentUser.name || "");
      setDraftPhoto(currentUser.photo || "");
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("uvnet_auth_user");
    window.dispatchEvent(new Event("auth-changed"));
    setMobileOpen(false);
    setProfileOpen(false);
    setIsEditingName(false);
    setIsEditingPhoto(false);
    navigate("/");
  };

  const displayName =
    currentUser?.username || currentUser?.name || currentUser?.email || "User";

  const email = currentUser?.email || "No email";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const profilePhoto = currentUser?.photo || "";

  const saveUserProfile = (updates) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      ...updates,
    };

    localStorage.setItem("uvnet_auth_user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleSaveName = () => {
    const trimmedName = draftName.trim();
    saveUserProfile({
      username:
        trimmedName || currentUser?.username || currentUser?.name || "User",
    });
    setIsEditingName(false);
  };

  // const handleSavePhoto = () => {
  //   saveUserProfile({ photo: draftPhoto.trim() });
  //   setIsEditingPhoto(false);
  // };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDraftPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { name: "Home", href: "/" },
    {
      name: "Dashboard",
      href: "/dashboard",
      isButton: true,
    },
    {
      name: "Editor",
      href: "/editor",
      isButton: true,
    },
    { name: "Features", href: "/features", isButton: true },
  ];

  const isActiveRoute = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-linear-to-r from-black via-black/95 to-black/90 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl">
      <div className="w-full px-8 sm:px-12 py-2.5 sm:py-3 flex items-center gap-8">
        {/* SECTION 1: Company Name */}

        <div className="shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-3xl font-black bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tighter hover:scale-105 transition-transform duration-300">
              UV<span className="text-white">netware</span>
            </div>
          </Link>
        </div>

        {/* SECTION 2: NAVIGATION (Center) */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-8">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);

            if (item.isButton) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-5 py-2 text-white text-base font-bold rounded-lg transition-all duration-300 shadow-lg flex items-center gap-2 group ${
                    isActive
                      ? "bg-blue-600 shadow-blue-500/60"
                      : "bg-linear-to-r hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/50 hover:translate-x-1"
                  }`}
                >
                  {item.name}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-white text-base font-medium rounded-lg transition-all duration-300 group relative whitespace-nowrap ${
                  isActive
                    ? "bg-blue-500/20 text-blue-300"
                    : "hover:bg-blue-500/10 hover:text-blue-400"
                }`}
              >
                <span>{item.name}</span>
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-300 rounded-full ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            );
          })}
        </div>

        {/* SECTION 3: Login/Signup */}

        <div className="hidden md:flex shrink-0 items-center gap-4">
          {currentUser ? (
            <>
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#000021] hover:bg-[#000055] transition-all duration-300 text-white"
                  style={{ border: "1.75px solid #000055" }}
                >
                  {/* User Icon */}
                  <FiUser className="w-4 h-4 text-blue-400" />

                  {/* Initial Circle */}
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>

                  {/* Down Arrow */}
                  <FiChevronDown className="w-4 h-4 text-blue-300" />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-[#000021] rounded-xl p-2 shadow-2xl"
                    style={{ border: "1.75px solid #000055" }}
                  >
                    <button
                      onClick={() => {
                        navigate("/my-layouts");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-[#000055] rounded-lg transition"
                    >
                      My Layouts
                    </button>

                    <button
                      onClick={() => {
                        navigate("/subscription");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-[#000055] rounded-lg transition"
                    >
                      Subscription Status
                    </button>

                    <button
                      onClick={() => {
                        navigate("/profile");
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-[#000055] rounded-lg transition"
                    >
                      Edit Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-blue-400 hover:bg-[#000055] rounded-lg transition"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {(isEditingName || isEditingPhoto) && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-[#000021] rounded-xl p-4 shadow-2xl"
                    style={{ border: "1.75px solid #000055" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Profile Photo */}
                      {draftPhoto && (
                        <img
                          src={draftPhoto}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-white text-sm"
                      />

                      {/* Name */}
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="w-full p-2 rounded bg-black text-white"
                        style={{ border: "1.75px solid #000055" }}
                      />

                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleSaveName}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setIsEditingPhoto(false);
                          }}
                          className="flex-1 bg-[#000021] text-white py-2 rounded"
                          style={{ border: "1.75px solid #000055" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-white text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-white text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
              >
                Signup
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden shrink-0 ml-auto">
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
              const isActive = isActiveRoute(item.href);

              if (item.isButton) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-all duration-300 font-bold shadow-lg text-lg ${
                      isActive
                        ? "bg-blue-600"
                        : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-white rounded-lg transition-colors duration-300 text-lg ${
                    isActive ? "bg-blue-500/25" : "hover:bg-blue-500/20"
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-blue-500/20 space-y-2 mt-4">
              {currentUser ? (
                <>
                  <div
                    className="flex items-center gap-3 px-3 py-2 rounded-full bg-[#000021]"
                    style={{ border: "1.75px solid #000055" }}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {initials}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {displayName}
                      </p>
                      <p className="text-blue-200 text-xs truncate">{email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#000021] text-white rounded-lg hover:bg-[#000055] transition-colors duration-300 font-bold text-lg"
                    style={{ border: "1px solid #000055" }}
                    type="button"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
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
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg border border-blue-600 hover:bg-linear-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white hover:border-transparent transition-all duration-300 font-bold text-lg"
                  >
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
