import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>UVNPL SeatMatrixt</div>

      <div style={styles.links}>
        <a href="#features" style={styles.link}>Features</a>
        <a href="#architecture" style={styles.link}>Architecture</a>
        <a href="#pricing" style={styles.link}>Pricing</a>
        <Link to="/login" style={styles.link}>Login</Link>
        <button style={styles.demoBtn}>Request Demo</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  logo: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },

  link: {
    textDecoration: "none",
    color: "#fff",
    fontWeight: "500",
    fontSize: "14px",
  },

  demoBtn: {
    padding: "8px 16px",
    background: "#0000ee",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};