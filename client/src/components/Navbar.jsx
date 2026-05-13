import { Link } from 'react-router-dom'
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="nav-logo">BruinServices</h1>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/browse">Browse</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup" className="signup-button">Sign Up</Link>
      </div>
    </nav>
  )
}
