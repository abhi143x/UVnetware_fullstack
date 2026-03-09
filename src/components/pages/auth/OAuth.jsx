import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { app } from "../../../fireBase";

export default function OAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);

      console.log("Google sign-in successful:", result.user);

      const googleUser = {
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
        uid: result.user.uid,
      };
      localStorage.setItem("uvnet_auth_user", JSON.stringify(googleUser));
      window.dispatchEvent(new Event("auth-changed"));

      // For now, just navigate to home after successful Google sign-in
      navigate("/");
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      if (error?.code === "auth/configuration-not-found") {
        setError(
          "Google sign-in is not enabled in Firebase Console for this project.",
        );
      } else {
        setError(error.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg uppercase font-semibold transition-colors w-full disabled:opacity-70"
        onClick={handleGoogleClick}
        disabled={loading}
        type="button"
      >
        {loading ? "Loading..." : "Continue with Google"}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
