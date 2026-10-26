/**
 * rooms.api.js — Room type and room API calls
 *
 * LIVE endpoints (Modules 1–3 complete):
 *   GET  /api/v1/room-types            → list active room types
 *   GET  /api/v1/room-types/:id        → get one room type
 *   POST /api/v1/room-types            → create (staff)
 *   PATCH /api/v1/room-types/:id       → update (staff)
 *   GET  /api/v1/rooms/available       → availability search
 *   GET  /api/v1/rooms                 → list rooms (staff)
 *   GET  /api/v1/rooms/:id             → single room (staff)
 *   POST /api/v1/rooms                 → create room (manager/admin)
 *   PATCH /api/v1/rooms/:id            → update room (manager/admin)
 */
import api from './axios'

export const roomTypesApi = {
  getAll:     (params) => api.get('/room-types', { params }),
  getOne:     (id)     => api.get(`/room-types/${id}`),
  create:     (data)   => api.post('/room-types', data),
  update:     (id, data) => api.patch(`/room-types/${id}`, data),
  addImage:   (id, formData) =>
    api.post(`/room-types/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeImage: (id, imgId) => api.delete(`/room-types/${id}/images/${imgId}`),
}

export const roomsApi = {
  search:   (params) => api.get('/rooms/available', { params }),
  getAll:   (params) => api.get('/rooms', { params }),
  getOne:   (id)     => api.get(`/rooms/${id}`),
  create:   (data)   => api.post('/rooms', data),
  update:   (id, data) => api.patch(`/rooms/${id}`, data),
}
