import "./navBar.css";

const NavBar = () => {
  return (
    <nav>
      <div className="navContainer">
        <span className="logo">
          <a href="#">TicketBook</a>
        </span>
        <span className="navLink">
          <a href="#">Home</a>
          <a href="#">My bookings</a>
          <a href="#">About</a>
          <a href="#">Contact Us</a>
        </span>
        <span>
          <input id="search" type="text" />
          <label htmlFor="search">Search Ticket</label>
        </span>
        <span className="auth">
          <a href="#">Login</a>
          <a href="#">SignUp</a>
        </span>
      </div>
    </nav>
  );
};

export default NavBar;
