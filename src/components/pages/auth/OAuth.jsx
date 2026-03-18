import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { app } from "../../../fireBase";
import { supabase } from "../../../supabaseClient";

export default function OAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // "google" | "github" | null
  const [error, setError] = useState("");

  // ─── Google (Firebase) ───────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    try {
      setLoading("google");
      setError("");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);

      const googleUser = {
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
        uid: result.user.uid,
      };

      localStorage.setItem("uvnet_auth_user", JSON.stringify(googleUser));
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");

    } catch (err) {
      console.error("Google sign-in error:", err);
      const errorMessages = {
        "auth/configuration-not-found": "Google sign-in is not enabled in Firebase Console.",
        "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
        "auth/account-exists-with-different-credential":
          "An account already exists with the same email using a different sign-in method.",
      };
      setError(errorMessages[err?.code] || err.message || "Failed to sign in with Google");
    } finally {
      setLoading(null);
    }
  };

  // ─── GitHub (Supabase) ───────────────────────────────────────────────
  const handleGithubSignIn = async () => {
    try {
      setLoading("github");
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Supabase redirects automatically — no navigate() needed

    } catch (err) {
      console.error("GitHub sign-in error:", err);
      setError(err.message || "Failed to sign in with GitHub");
      setLoading(null);
    }
  };

  // ─── Button config ───────────────────────────────────────────────────
  const buttons = [
    {
      name: "google",
      label: "Continue with Google",
      onClick: handleGoogleSignIn,
      icon: (
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="w-5 h-5"
        />
      ),
      className: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40",
    },
    {
      name: "github",
      label: "Continue with GitHub",
      onClick: handleGithubSignIn,
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
            0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755
            -1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305
            3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93
            0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322
            3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405
            2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84
            1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81
            2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795
            24 17.295 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      className: "bg-gray-800 hover:bg-gray-900 hover:shadow-gray-700/40",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {buttons.map(({ name, label, icon, onClick, className }) => (
        <button
          key={name}
          onClick={onClick}
          disabled={loading !== null}
          type="button"
          className={`w-full flex items-center justify-center gap-3 px-4 py-3
            text-white font-semibold rounded-lg transition-all duration-300
            hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
            ${className}`}
        >
          {icon}
          {loading === name ? "Signing in..." : label}
        </button>
      ))}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}