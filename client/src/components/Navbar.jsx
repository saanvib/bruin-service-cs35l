import { Link } from 'react-router-dom'
import { useDescope, useSession } from '@descope/react-sdk'
import { useRole } from '../hooks/useRole'
import './Navbar.css';

export default function Navbar() {
  const { logout } = useDescope()
  const { isAuthenticated } = useSession()
  const { isProvider, isCustomer } = useRole()

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}><h1 className="nav-logo">BruinServices</h1></Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        {isCustomer && <Link to="/browse">Browse</Link>}
        {isProvider && <Link to="/dashboard">Dashboard</Link>}
        {isCustomer && <Link to="/favorites">Saved</Link>}
        <Link to="/chat">Chat</Link>
        <Link to="/notifications">Notifications</Link>
        {isAuthenticated
          ? <button onClick={() => logout()} className="nav-logout">Logout</button>
          : <Link to="/login" className="nav-login">Login</Link>
        }
      </div>
    </nav>
  )
}
