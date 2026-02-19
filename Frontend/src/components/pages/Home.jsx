import React from "react";
import builderImage from "../../assets/builder.png";
import architectureImage from "../../assets/architecture.png";
import problemImage from "../../assets/problem.png";


export default function Home() {
  return (
    <div style={styles.container}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heading}>
            UV SeatMatrix
          </h1>
          <h2 style={styles.subHeading}>
            Enterprise Seat Layout Infrastructure
          </h2>
          <p style={styles.subtext}>
            A scalable layout engine built for transport operators,
            airlines, railways, and event platforms. Design, manage,
            and integrate seat layouts through secure APIs.
          </p>

          <div style={styles.buttons}>
            <button style={styles.primaryBtn}>Request Technical Demo</button>
            <button style={styles.secondaryBtn}>View API Documentation</button>
          </div>
        </div>

        <div style={styles.heroRight}>
          <img src={builderImage} alt="Seat Layout Builder" style={styles.heroImg} />
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Built for Booking Ecosystems</h2>
        <div style={styles.grid}>
          <div>Bus Operators & Aggregators</div>
          <div>Airline Reservation Platforms</div>
          <div>Railway Systems</div>
          <div>Event & Stadium Platforms</div>
          <div>Travel & Super Apps</div>
          <div>White-label Booking Solutions</div>
        </div>
      </section>

      {/* PROBLEM */}
  <section style={styles.sectionAlt}>
  <div style={styles.problemContainer}>

    {/* TEXT SIDE */}
    <div style={styles.problemText}>
      <h2 style={styles.problemTitle}>
        Why Traditional Layout Systems Fail
      </h2>

      <div style={styles.problemList}>
        {[
          "Rebuilding layout engines for every platform",
          "No standardized seat schema",
          "Complex pricing & category logic",
          "Multi-floor handling complexity",
          "Scalability issues under load",
        ].map((item, index) => (
          <div key={index} style={styles.problemItem}>
            <span style={styles.problemIcon}>⚠</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* IMAGE SIDE */}
    <div style={styles.problemImageWrapper}>
      <div style={styles.imageGlow}></div>
      <img
        src={problemImage}
        alt="Layout System Problems"
        style={styles.problemImage}
      />
    </div>

  </div>
</section>
                {/* SOLUTION */}

      <section style={styles.section}>
  <div style={styles.solutionContainer}>

    {/* LEFT SIDE FEATURES */}
    <div style={styles.solutionText}>
      <h2 style={styles.solutionTitle}>
        Infrastructure-First Approach
      </h2>

      <div style={styles.featureGrid}>
        {[
          "Drag & Drop Layout Builder",
          "Multi-level & Multi-category Support",
          "Standardized JSON Export Schema",
          "RESTful API Integration",
          "Version-controlled Layouts",
          "Multi-tenant SaaS Architecture",
          "Secure API Key Authentication",
        ].map((feature, index) => (
          <div key={index} style={styles.featureCard}>
            <div style={styles.featureIcon}>⚙</div>
            <p>{feature}</p>
          </div>
        ))}
      </div>
    </div>

    {/* RIGHT SIDE IMAGE */}
    <div style={styles.solutionImageWrapper}>
      <div style={styles.blueGlow}></div>
      <img
        src={builderImage}
        alt="Builder Preview"
        style={styles.solutionImage}
      />
    </div>

  </div>
</section>

      {/* ARCHITECTURE */}
      <section style={styles.sectionAlt}>
        <h2 style={styles.sectionTitle}>Enterprise-Ready Architecture</h2>
        <img
          src={architectureImage}
          alt="Architecture"
          style={styles.archImg}
        />
        <p style={styles.archText}>
          React Builder → Spring Boot Core → PostgreSQL →
          Secure API Gateway → Multi-Tenant Isolation
        </p>
      </section>

      {/* BENEFITS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Enterprise Benefits</h2>
        <ul style={styles.list}>
          <li>Reduce development time by 70%</li>
          <li>Standardized API integration</li>
          <li>Faster deployment cycles</li>
          <li>Lower infrastructure costs</li>
          <li>Scalable across multiple tenants</li>
        </ul>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2>Power Your Booking Platform with UV SeatMatrix</h2>
        <button style={styles.primaryBtn}>Schedule Demo</button>
      </section>

    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    color: "#fff",
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    padding: "80px 0",
  },

  heroLeft: {
    flex: 1,
    minWidth: "300px",
  },

  heroRight: {
    flex: 1,
    textAlign: "center",
  },

  heroImg: {
    maxWidth: "100%",
    borderRadius: "12px",
  },

  heading: {
    fontSize: "42px",
    fontWeight: "900",
    color: "#0000ee",
  },

  subHeading: {
    fontSize: "22px",
    marginBottom: "20px",
  },

  subtext: {
    fontSize: "15px",
    lineHeight: "24px",
    marginBottom: "30px",
    opacity: 0.9,
  },

  buttons: {
    display: "flex",
    gap: "15px",
  },

  primaryBtn: {
    padding: "12px 24px",
    background: "#0000ee",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  secondaryBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #fff",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

  section: {
    padding: "80px 0",
    textAlign: "center",
  },

  sectionAlt: {
    padding: "80px 0",
    textAlign: "center",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
  },

  sectionTitle: {
    fontSize: "28px",
    marginBottom: "25px",
  },

  list: {
    listStyle: "none",
    padding: 0,
    lineHeight: "30px",
    opacity: 0.9,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  archImg: {
    maxWidth: "80%",
    marginTop: "20px",
  },

  archText: {
    marginTop: "20px",
    opacity: 0.8,
  },

  cta: {
    textAlign: "center",
    padding: "100px 0",
  },
 problemTitle: {
  fontSize: "30px",
  fontWeight: "800",
  marginBottom: "30px",
  background: "linear-gradient(90deg,#ff4d4d,#ff0000)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
},

problemList: {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
},

problemItem: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(255,0,0,0.05)",
  border: "1px solid rgba(255,0,0,0.2)",
  padding: "14px 18px",
  borderRadius: "10px",
  fontSize: "15px",
  transition: "0.3s",
},

problemIcon: {
  color: "#ff4d4d",
  fontSize: "18px",
},

problemImageWrapper: {
  flex: 1,
  position: "relative",
  textAlign: "center",
},

problemImage: {
  maxWidth: "100%",
  borderRadius: "14px",
  position: "relative",
  zIndex: 2,
},

imageGlow: {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  height: "90%",
  background: "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)",
  filter: "blur(40px)",
  zIndex: 1,
},
solutionContainer: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "60px",
},

solutionText: {
  flex: 1,
  minWidth: "300px",
},

solutionTitle: {
  fontSize: "32px",
  fontWeight: "800",
  marginBottom: "40px",
  background: "linear-gradient(90deg,#0000ee,#4da6ff)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
},

featureGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
},

featureCard: {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "18px",
  borderRadius: "12px",
  display: "flex",
  gap: "12px",
  alignItems: "center",
  transition: "0.3s",
},

featureIcon: {
  fontSize: "18px",
  color: "#0000ee",
},

solutionImageWrapper: {
  flex: 1,
  position: "relative",
  textAlign: "center",
  minWidth: "300px",
},

solutionImage: {
  maxWidth: "100%",
  borderRadius: "16px",
  position: "relative",
  zIndex: 2,
  animation: "float 6s ease-in-out infinite",
},

blueGlow: {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "85%",
  height: "85%",
  background: "radial-gradient(circle, rgba(0,0,255,0.25) 0%, transparent 70%)",
  filter: "blur(60px)",
  zIndex: 1,
},
};