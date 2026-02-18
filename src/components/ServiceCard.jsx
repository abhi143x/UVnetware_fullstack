import React from "react";

export default function ServiceCard({ title, desc, bgImage }) {
  return (
    <div
      style={{
        ...styles.card,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.35)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={styles.content}>
       <a href="/" style={{ textDecoration: "none" }}>
        <h3 style={styles.title}>{title}</h3>
       </a>
        <p style={styles.desc}>{desc}</p>
      </div>

      <button
  style={styles.btn}
  onMouseEnter={(e) => (e.target.style.background = "#00cc00")}
  onMouseLeave={(e) => (e.target.style.background = "#0000ee")}
>
  Book Now
</button>

    </div>
  );
}

const styles = {
  card: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "18px",
    padding: "20px",
    minHeight: "230px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backdropFilter: "blur(14px)",
    transition: "0.3s",
  },

  content: {
    textAlign: "center",
    marginTop: "40px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#f90000ad",
    marginBottom: "10px",
    textShadow: "0px 2px 6px rgba(0,0,0,0.8)",
  },

  desc: {
    fontSize: "14px",
    fontWeight: "300",
    color: "#ffffff",
    lineHeight: "20px",
    textShadow: "0px 2px 6px rgba(0,0,0,0.8)",
  },

  btn: {
  width: "100%",
  padding: "10px",
  borderRadius: "12px",
  border: "none",
  background: "#0000ee",
  color: "#fff",
  fontWeight: "500",
  cursor: "pointer",
  transition: "0.2s",
},

};
