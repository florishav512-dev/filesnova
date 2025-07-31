import { Link } from "react-router-dom";

const Navbar = () => (

<nav className="p-4 bg-gray-100 flex gap-4"> <Link to="/">Home</Link> <Link to="/help-center">Help</Link> <Link to="/contact">Contact</Link> <Link to="/privacy-policy">Privacy</Link> <Link to="/terms-of-service">Terms</Link> <Link to="/cookie-policy">Cookies</Link> </nav> ); export default Navbar;
