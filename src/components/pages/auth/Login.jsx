import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "./OAuth";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getLoginEndpoint = () => {
    const directEndpoint = import.meta.env.VITE_AUTH_SIGNIN_URL?.trim();
    if (directEndpoint) return directEndpoint;

    const baseUrl = import.meta.env.VITE_AUTH_API_URL?.trim();
    if (!baseUrl) return "";

    return `${baseUrl.replace(/\/$/, "")}/signin`;
  };

  const parseJsonSafely = async (response) => {
    const rawBody = await response.text();
    if (!rawBody) return {};

    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const endpoint = getLoginEndpoint();
      let loggedInUser = {
        email: formData.email,
      };

      // Allow local-only auth in development when no backend endpoint is configured.
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await parseJsonSafely(response);
        if (data === null) {
          setError("Server returned an invalid response format");
          return;
        }

        if (!response.ok || data.success === false) {
          setError(data.message || "Sign in failed");
          return;
        }

        loggedInUser = data?.user ?? loggedInUser;
      }

      localStorage.setItem("uvnet_auth_user", JSON.stringify(loggedInUser));
      window.dispatchEvent(new Event("auth-changed"));

      navigate("/");
    } catch (submitError) {
      setError(submitError.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl text-center font-semibold mb-7">Sign <span className="text-blue-500">Up</span></h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="p-3 rounded-lg bg-[#000000] text-white"
            style={{ border: "1px solid white" }}
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            id="email"
          />
          <input
            className="p-3 rounded-lg bg-[#000000] text-white"
            style={{ border: "1px solid white" }}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            id="password"
          />
          <button
            disabled={loading}
            className="bg-[#000021] text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
            style={{ border: "1.75px solid #000055" }}
            type="submit"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <OAuth />
        </form>
        <div className="flex gap-2 mt-5 justify-center">
          <p>Don't have an account? </p>
          <Link to="/signup">
            <span className="text-blue-500">Sign Up</span>
          </Link>
        </div>
        {error && <p className="text-red-500 mt-5">{error}</p>}
      </div>
    </div>
  );
}
