import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import RequireRole from './components/RequireRole'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailPage from './pages/ListingDetailPage'
import ProviderProfilePage from './pages/ProviderProfilePage'
import DashboardPage from './pages/DashboardPage'
import BookingPage from './pages/BookingPage'
import ChatPage from './pages/ChatPage'
//import NotificationsPage from './pages/NotificationsPage'
import SavedListingsPage from './pages/SavedListingPage'
import './App.css';

function RootLayout() {
  return (
    <>
      <Navbar />
      <div className="main-container">
        <Outlet />
      </div>
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true,           element: <HomePage /> },
          { path: 'listings/:id',  element: <ListingDetailPage /> },
          { path: 'providers/:id', element: <ProviderProfilePage /> },
          { path: 'chat',          element: <ChatPage /> },
          {
            element: <RequireRole role="customer" />,
            children: [
              { path: 'browse',       element: <BrowsePage /> },
              { path: 'bookings/:id', element: <BookingPage /> },
              { path: 'favorites', element: <SavedListingsPage /> },
            ]
          },
          {
            element: <RequireRole role="provider" />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
            ]
          },
        ]
      }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
