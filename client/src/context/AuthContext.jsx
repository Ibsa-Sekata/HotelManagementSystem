/**
 * AuthContext.jsx — Global authentication state
 *
 * Provides: user, isAuthenticated, isLoading, login(), register(), logout()
 * Accessible from any component via useAuth() hook.
 *
 * On mount it checks if there is a valid stored token and fetches the user profile,
 * so page refreshes don't log the user out.
 */
import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { authApi } from '../api/auth.api'

const AuthContext = createContext(null)

const initialState = {
  user:            null,
  accessToken:     localStorage.getItem('accessToken') || null,
  isLoading:       true,   // true while checking saved token on mount
  isAuthenticated: false,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload.user, accessToken: action.payload.accessToken, isAuthenticated: true, isLoading: false }
    case 'AUTH_LOGOUT':
      return { ...state, user: null, accessToken: null, isAuthenticated: false, isLoading: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'UPDATE_USER':
      return { ...state, user: action.payload }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      dispatch({ type: 'AUTH_LOGOUT' })
      return
    }
    authApi.getMe()
      .then(({ data }) => {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, accessToken: token } })
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        dispatch({ type: 'AUTH_LOGOUT' })
      })
  }, [])

  // ── Listen for forced logout (from axios interceptor) ─────────────────────
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('accessToken', data.accessToken)
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, accessToken: data.accessToken } })
    return data.user
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData)
    localStorage.setItem('accessToken', data.accessToken)
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, accessToken: data.accessToken } })
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* best-effort */ }
    localStorage.removeItem('accessToken')
    dispatch({ type: 'AUTH_LOGOUT' })
  }, [])

  const updateUser = useCallback((user) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
