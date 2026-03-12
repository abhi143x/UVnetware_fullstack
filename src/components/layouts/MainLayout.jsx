import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer1.jsx";

export default function MainLayout({ children, showFooter = true }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">{children ?? <Outlet />}</main>
      {showFooter && <Footer />}
    </div>
  );
}
