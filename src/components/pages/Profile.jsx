import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

export default function Profile() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("uvnet_auth_user")) || {};

  const [user] = useState(storedUser);
  const [name, setName] = useState(
    storedUser.username || storedUser.name || "",
  );
  const [email, setEmail] = useState(storedUser.email || "");
  const [photo, setPhoto] = useState(storedUser.photo || "");
  const handleSave = () => {
    const updatedUser = {
      ...user,
      username: name,
      email: email,
      photo: photo,
    };

    localStorage.setItem("uvnet_auth_user", JSON.stringify(updatedUser));

    window.dispatchEvent(new Event("auth-changed"));

    alert("Profile updated successfully!");
    navigate(-1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center px-6">
      <div
        className="w-full max-w-lg p-8 rounded-xl bg-[#000021] shadow-2xl"
        style={{ border: "1.75px solid #000055" }}
      >
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Edit Profile
        </h1>

        {/* Profile Image */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {photo ? (
            <img
              src={photo}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
              {name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-blue-300">Full Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded bg-black text-white"
            style={{ border: "1.5px solid #000055" }}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-blue-300">Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-black text-white"
            style={{ border: "1.5px solid #000055" }}
          />
        </div>

        {/* Password */}
<div className="mb-6">
  <label className="block mb-2 text-sm text-blue-300">
    New Password
  </label>

  <div className="relative">
    {/* Lock Icon */}
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      <FaLock />
    </span>

    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter new password"
      className="w-full p-3 pl-10 pr-12 rounded bg-black text-white"
      style={{ border: "1.5px solid #000055" }}
    />

    {/* Eye Icon */}
    <span
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
  </div>
</div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
