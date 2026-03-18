import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("Auth callback error:", error);
        navigate("/login");
        return;
      }

      const user = data.session.user;

      const authUser = {
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email,
        photo: user.user_metadata?.avatar_url || "",
        uid: user.id,
      };

      localStorage.setItem("uvnet_auth_user", JSON.stringify(authUser));
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <p>Signing you in...</p>
    </div>
  );
}