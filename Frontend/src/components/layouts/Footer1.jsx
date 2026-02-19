import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        
        <div style={styles.column}>
          <h3 style={styles.heading}>UVNPL SeatMatrixt</h3>
          <p style={styles.text}>
            Enterprise-grade seat layout infrastructure for transport
            and event platforms.
          </p>
        </div>

        <div style={styles.column}>
          <h4 style={styles.subheading}>Product</h4>
          <p style={styles.link}>Features</p>
          <p style={styles.link}>Architecture</p>
          <p style={styles.link}>API Docs</p>
          <p style={styles.link}>Pricing</p>
        </div>

        <div style={styles.column}>
          <h4 style={styles.subheading}>Company</h4>
          <p style={styles.link}>About</p>
          <p style={styles.link}>Contact</p>
          <p style={styles.link}>Support</p>
        </div>

        <div style={styles.column}>
          <h4 style={styles.subheading}>Legal</h4>
          <p style={styles.link}>Privacy Policy</p>
          <p style={styles.link}>Terms of Service</p>
        </div>

      </div>

      <div style={styles.bottom}>
        © 2026 UVNPL SeatMatrixt. All rights reserved.
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "80px",
    background: "rgba(255,255,255,0.05)",
    paddingTop: "60px",
    color: "#fff",
  },

  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
    padding: "0 40px 60px 40px",
  },

  column: {
    display: "flex",
    flexDirection: "column",
  },

  heading: {
    fontSize: "20px",
    fontWeight: "800",
    marginBottom: "15px",
  },

  subheading: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "15px",
    opacity: 0.8,
  },

  text: {
    fontSize: "14px",
    lineHeight: "22px",
    opacity: 0.8,
  },

  link: {
    fontSize: "14px",
    marginBottom: "8px",
    opacity: 0.7,
    cursor: "pointer",
  },

  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    padding: "20px",
    fontSize: "13px",
    opacity: 0.6,
  },
};