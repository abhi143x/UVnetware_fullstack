import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer1.jsx";

export default function MainLayout({ children, showFooter = true }) {
  return (
    <>
      <Navbar />
      {children ?? <Outlet />}
      {showFooter && <Footer />}
    </>
  );
}
