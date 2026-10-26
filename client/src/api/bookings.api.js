/**
 * bookings.api.js — Booking API calls
 *
 * STATUS: PLACEHOLDER — Backend Module 5 not yet built.
 * These functions exist so the frontend is wired up correctly.
 * They will be connected to real endpoints when Module 5 is complete.
 *
 * When Module 5 is ready, ONLY this file needs to change —
 * no page components need to be rewritten.
 */
import api from './axios'

export const bookingsApi = {
  // Customer
  create: (data) => api.post('/bookings', data),
  getMine: (params) => api.get('/bookings/my', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),

  // Staff
  createForGuest: (data) => api.post('/bookings/staff', data),
  getAll: (params) => api.get('/bookings', { params }),
  checkIn: (id) => api.patch(`/bookings/${id}/checkin`),
  checkOut: (id) => api.patch(`/bookings/${id}/checkout`),
}

export const invoicesApi = {
  generate: (bookingId) => api.post(`/invoices/booking/${bookingId}`),
  getOne: (id) => api.get(`/invoices/${id}`),
}

// ── Demo data used until Module 5 is live ──────────────────────────────────────
export const DEMO_BOOKINGS = [
  {
    _id: 'demo-1',
    bookingRef: 'HMS-20261025-A3F7',
    roomType: { name: 'Deluxe King', basePrice: 4200 },
    room: { roomNumber: '201' },
    checkIn: '2026-11-15',
    checkOut: '2026-11-18',
    nights: 3,
    totalPrice: 14490,
    currency: 'ETB',
    status: 'confirmed',
    paymentStatus: 'paid',
    adults: 2,
    children: 0,
  },
  {
    _id: 'demo-2',
    bookingRef: 'HMS-20261002-B8K2',
    roomType: { name: 'Standard Double', basePrice: 2500 },
    room: { roomNumber: '103' },
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    nights: 2,
    totalPrice: 5750,
    currency: 'ETB',
    status: 'checked_out',
    paymentStatus: 'paid',
    adults: 1,
    children: 0,
  },
]

export const DEMO_ARRIVALS = [
  { _id: 'd1', bookingRef: 'HMS-20261025-X9Y2', guest: 'Tigist Haile', room: '301', roomType: 'Executive Suite', checkIn: '2026-10-25', checkOut: '2026-10-28', status: 'confirmed', paymentStatus: 'pending' },
  { _id: 'd2', bookingRef: 'HMS-20261025-M5N8', guest: 'Samuel Tesfaye', room: '202', roomType: 'Deluxe King', checkIn: '2026-10-25', checkOut: '2026-10-26', status: 'confirmed', paymentStatus: 'paid' },
  { _id: 'd3', bookingRef: 'HMS-20261024-K3P1', guest: 'Meron Alemu', room: '101', roomType: 'Standard Double', checkIn: '2026-10-24', checkOut: '2026-10-25', status: 'checked_in', paymentStatus: 'paid' },
]
