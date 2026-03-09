import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer1.jsx";

export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      {children ?? <Outlet />}
      <Footer />
    </>
  );
}
