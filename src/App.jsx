import { useEffect } from "react";
import Lenis from "lenis";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);


  return <AppRoutes />;
}
