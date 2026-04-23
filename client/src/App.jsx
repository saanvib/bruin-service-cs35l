import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailPage from './pages/ListingDetailPage'
import ProviderProfilePage from './pages/ProviderProfilePage'
import DashboardPage from './pages/DashboardPage'
import BookingPage from './pages/BookingPage'
import ChatPage from './pages/ChatPage'
import NotificationsPage from './pages/NotificationsPage'

function RootLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true,              element: <HomePage /> },
      { path: 'login',            element: <LoginPage /> },
      { path: 'signup',           element: <SignupPage /> },
      { path: 'browse',           element: <BrowsePage /> },
      { path: 'listings/:id',     element: <ListingDetailPage /> },
      { path: 'providers/:id',    element: <ProviderProfilePage /> },
      { path: 'dashboard',        element: <DashboardPage /> },
      { path: 'bookings/:id',     element: <BookingPage /> },
      { path: 'chat',             element: <ChatPage /> },
      { path: 'notifications',    element: <NotificationsPage /> },
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
