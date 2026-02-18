import React from "react";

export default function Navbar() {
return (
    <nav style={styles.nav}>
        <a href="/" style={{ textDecoration: "none" }}>
            <h2 style={styles.logo}>Universal Booking</h2>
        </a>

                <div style={styles.links}>
            <a style={styles.link} href="/">Home</a>
            <a style={styles.link} href="/">Bookings</a>
            <a style={styles.link} href="/">Offers</a>
            <a style={styles.link} href="/">Support</a>
        </div>

        <button style={styles.btn}>Login</button>
    </nav>
);
}

const styles = {
   nav: {
    width: "100%",
    padding: "16px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // background: "rgba(69,69,69,0.15)",
    backdropFilter: "blur(10px)",
    // borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(69,69,69,0.2)",
    borderBottom: "1px solid #454545",
    position: "sticky",   
    top: 0,               
    zIndex: 9999          
  },
  logo: {
    fontWeight: "900",
    fontSize: "22px",
    color: "#fff"
  },
  links: {
    display: "flex",
    gap: "25px",
  },
  link: {
    fontWeight: "500",
    color: "#eee",
    fontSize: "15px",
  },
  btn: {
    background: "#0000ee",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "500",
    color: "#fff",
    cursor: "pointer"
  }
};
