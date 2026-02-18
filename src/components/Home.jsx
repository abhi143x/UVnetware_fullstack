import React, { useState } from "react";
import ServiceCard from "./ServiceCard";
import busImage from "../assets/bus.jpg";
import trainImage from "../assets/train.jpg";
import flightImage from "../assets/flight.jpg";
import hotelImage from "../assets/hotel.jpg";
import movieImage from "../assets/movies.jpg";
import eventImage from "../assets/event.jpg";
import tourImage from "../assets/tour.jpg";
import cruiseImage from "../assets/cruise.jpg";
import sportsImage from "../assets/sports.jpg";
import cabImage from "../assets/cab.jpg";

export default function Home() {
  const [searchText, setSearchText] = useState("");


  const services = [
    {
      title: "Bus Tickets",
      desc: "Book bus tickets with best offers.",
      bgImage: busImage,
      link: "/bus",
    },
    {
      title: "Train Tickets",
      desc: "Book train tickets instantly.",
      bgImage: trainImage,
      link: "/train",
    },
    {
      title: "Flight Tickets",
      desc: "Get cheap flights in seconds.",
      bgImage: flightImage,
      link: "/flight",
    },
    {
      title: "Hotels",
      desc: "Book hotels with luxury comfort.",
      bgImage: hotelImage,
      link: "/hotel",
    },
    {
      title: "Movies",
      desc: "Book movie tickets with ease.",
      bgImage: movieImage,
      link: "/movie",
    },
    {
      title: "Events",
      desc: "Concerts, shows and events booking.",
      bgImage: eventImage,
      link: "/event",
    },
    {
      title: "Tour Packages",
      desc: "Explore tour packages with customized plans.",
      bgImage: tourImage,
      link: "/tour",
    },
    {
      title: "Cruise Booking",
      desc: "Book cruise tickets with premium facilities.",
      bgImage: cruiseImage,
      link: "/cruise",
    },
    {
      title: "Sports Tickets",
      desc: "Book cricket, football and other sports tickets.",
      bgImage: sportsImage,
      link: "/sports",
    },
    {
      title: "Cab Booking",
      desc: "Book cab rides with secure and fast service.",
      bgImage: cabImage,
      link: "/cab",
    },
  ];
  const filteredServices = services
  .filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  )
  .sort((a, b) => {
    const aMatch = a.title.toLowerCase().startsWith(searchText.toLowerCase());
    const bMatch = b.title.toLowerCase().startsWith(searchText.toLowerCase());

    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return a.title.localeCompare(b.title);
  });
const handleSearch = () => {
  if (filteredServices.length > 0) {
    window.location.href = filteredServices[0].link;
  } else {
    alert("No service found!");
  }
};

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <h1 style={styles.heading}>
          One Platform for <span style={styles.accent}>All Bookings</span>
        </h1>

        <p style={styles.subtext}>
          Book bus, train, flight, hotels, movies and events from one universal
          platform.
        </p>
        {/* Search Box Started */}

        <div style={styles.searchBox}>
         <input
         style={styles.input}
         type="text"
         placeholder="Search tickets, hotels, movies..."
         value={searchText}
         onChange={(e) => setSearchText(e.target.value)}
         onKeyDown={(e) => {
         if (e.key === "Enter") {
         handleSearch();
    }
  }}
/>


    <button style={styles.searchBtn} onClick={handleSearch}>
         Search
    </button>

        </div>
      </section>

      {/* Serach box Ended */}
      <section style={styles.grid}>
        {filteredServices.map((item, index) => (
          <ServiceCard
            key={index}
            title={item.title}
            desc={item.desc}
            bgImage={item.bgImage}
            link={item.link}
          />
        ))}
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px 40px",
  },
  hero: {
    textAlign: "center",
    padding: "50px 10px",
    borderRadius: "20px",
    background: "rgba(69,69,69,0.15)",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: "40px",
  },
  heading: {
    fontSize: "42px",
    fontWeight: "900",
    marginBottom: "10px",
  },
  accent: {
    color: "#0000ee",
  },
  subtext: {
    fontSize: "15px",
    fontWeight: "300",
    color: "white",
    maxWidth: "650px",
    margin: "0 auto 25px auto",
    lineHeight: "22px",
  },
  searchBox: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  input: {
    width: "320px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    outline: "none",
    fontWeight: "500",
  },
  searchBtn: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#0000ee",
    color: "#fff",
    fontWeight: "500",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
};
