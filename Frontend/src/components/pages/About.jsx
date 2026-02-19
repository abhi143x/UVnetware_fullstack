import React from "react";
import {
  FaFilm,
  FaBus,
  FaTrain,
  FaTicketAlt,
  FaCreditCard,
  FaBolt,
  FaLock,
  FaTags,
  FaHeadset,
} from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] font-['Roboto']">

      {/* Main */}
      <section className="bg-[#000000] border-b border-[#454545]">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-[#000000] mb-6">
            About <span className="text-[#0000ee]">TicketBook</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[#eeeeee] font-light leading-relaxed">
            TicketBook is your all-in-one ticket booking platform for movies,
            buses, trains, and live events. We make booking fast, secure,
            and effortless — so you can focus on the experience.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6 text-[#ffffff]">
            Who We Are
          </h2>

          <p className="text-[#eeeeee] leading-relaxed font-light mb-4">
            TicketBook simplifies how users discover and book tickets across
            travel and entertainment. One platform — multiple booking options.
          </p>

          <p className="text-[#eeeeee] leading-relaxed font-light">
            Built with performance, security, and usability in mind,
            our system ensures every booking is smooth and reliable.
          </p>
        </div>

        {/* Offer Card */}
        <div className="bg-[#111111] border border-[#454545] rounded-xl p-8">
          <h3 className="text-xl font-semibold mb-6 text-[#0000ee]">
            What We Offer
          </h3>

          <ul className="space-y-4 text-[#eeeeee] font-light">
            <li className="flex items-center gap-3">
              <FaFilm className="text-[#0000ee]" />
              Movie ticket booking
            </li>

            <li className="flex items-center gap-3">
              <FaBus className="text-[#0000ee]" />
              Bus reservations
            </li>

            <li className="flex items-center gap-3">
              <FaTrain className="text-[#0000ee]" />
              Train ticket search
            </li>

            <li className="flex items-center gap-3">
              <FaTicketAlt className="text-[#0000ee]" />
              Event & show bookings
            </li>

            <li className="flex items-center gap-3">
              <FaCreditCard className="text-[#0000ee]" />
              Secure online payments
            </li>
          </ul>
        </div>
      </section>

      {/* Mission Vision */}
      <section className="bg-[#000000] border-y border-[#454545]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">

          <div className="border border-[#454545] rounded-xl p-8 hover:border-[#0000ee] transition">
            <h3 className="text-2xl font-bold mb-4 text-[#ffffff]">
              Our Mission
            </h3>
            <p className="text-[#eeeeee] font-light leading-relaxed">
              Deliver a fast, transparent, and user-friendly ticket booking
              experience that saves time and builds trust.
            </p>
          </div>

          <div className="border border-[#454545] rounded-xl p-8 hover:border-[#0000ee] transition">
            <h3 className="text-2xl font-bold mb-4 text-[#ffffff]">
              Our Vision
            </h3>
            <p className="text-[#eeeeee] font-light leading-relaxed">
              Become the go-to digital platform for ticketing across travel
              and entertainment through innovation and reliability.
            </p>
          </div>

        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Why Choose <span className="text-[#0000ee]">TicketBook</span>
        </h2>

        <div className="grid md:grid-cols-4 gap-8">
          <Feature
            icon={FaBolt}
            title="Fast Booking"
            desc="Book tickets in seconds with smooth flow"
          />

          <Feature
            icon={FaLock}
            title="Secure"
            desc="Protected payments & data safety"
          />

          <Feature
            icon={FaTags}
            title="Best Prices"
            desc="Competitive pricing & offers"
          />

          <Feature
            icon={FaHeadset}
            title="24*7 Support"
            desc="Help available anytime"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0000ee] text-white">
        <div className="max-w-7xl mx-auto px-6 py-14 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Book Your Next Ticket?
          </h2>

          <p className="font-light mb-6 text-white/90">
            Join thousands of users who trust TicketBook every day.
          </p>

          <button className="bg-[#d50000] border border-[#454545] px-6 py-3 rounded-md font-medium hover:bg-[#00bfa5] transition cursor-pointer">
            Start Booking
          </button>
        </div>
      </section>

    </div>
  );
};

/* Feature Card Component */
const Feature = ({ icon: Icon, title, desc }) => (
  <div className="bg-[#111111] border border-[#454545] rounded-xl p-6 hover:border-[#0000ee] transition text-center">
    <Icon className="text-3xl text-[#0000ee] mx-auto mb-3" />
    <h4 className="font-semibold mb-2 text-[#ffffff]">{title}</h4>
    <p className="text-sm text-[#eeeeee] font-light">{desc}</p>
  </div>
);

export default About;
