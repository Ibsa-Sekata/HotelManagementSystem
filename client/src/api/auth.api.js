/**
 * auth.api.js — Authentication API calls
 * Maps to: POST /api/v1/auth/register|login|logout|refresh
 *           GET  /api/v1/auth/me
 *           PATCH /api/v1/auth/me | /api/v1/auth/me/password
 */
import api from './axios'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  refresh:  ()     => api.post('/auth/refresh'),
  getMe:    ()     => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.patch('/auth/me/password', data),
}
