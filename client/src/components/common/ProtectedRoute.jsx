import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Optionally accepts `roles` array to enforce role-based access.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
