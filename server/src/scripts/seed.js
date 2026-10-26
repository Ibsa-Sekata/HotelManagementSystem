/**
 * seed.js — Database seeder
 *
 * This script populates the database with initial data for development and testing.
 * It is NOT run automatically — you run it manually once after setting up the project.
 *
 * What it creates:
 *   1. Hotel settings (the single configuration document)
 *   2. One admin user account
 *   3. Sample room types (Standard, Deluxe, Suite)
 *   4. Sample rooms (3 of each type)
 *
 * How to run:
 *   cd server
 *   node src/scripts/seed.js
 *
 * WARNING: Running this script will clear existing seed data and re-insert it.
 * It will NOT delete bookings or payment records.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose     = require('mongoose');
const bcrypt       = require('bcryptjs');
const connectDB    = require('../config/db');
const User         = require('../models/User');
const RoomType     = require('../models/RoomType');
const Room         = require('../models/Room');
const HotelSettings = require('../models/HotelSettings');

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // ─── 1. Hotel Settings ────────────────────────────────────────────────────
    console.log('Creating hotel settings...');
    await HotelSettings.deleteMany({});
    await HotelSettings.create({
      hotelName: process.env.HOTEL_NAME || 'Grand Horizon Hotel',
      tagline:   'Your Home Away From Home',
      address: {
        street:  '123 Bole Road',
        city:    'Addis Ababa',
        country: 'Ethiopia',
      },
      contactPhone: '+251 11 000 0000',
      contactEmail: 'info@grandhorizon.example',
      currency:     process.env.HOTEL_CURRENCY || 'ETB',
      taxRate:      0.15,            // 15% VAT
      freeCancellationHours:    48,
      lateCancellationFeePercent: 50,
      noShowChargePercent:      100,
      checkInTime:  '14:00',
      checkOutTime: '11:00',
    });
    console.log('  ✓ Hotel settings created');

    // ─── 2. Admin User ────────────────────────────────────────────────────────
    console.log('\nCreating admin user...');
    await User.deleteMany({ role: { $in: ['admin', 'manager', 'receptionist'] } });

    const adminPassword = await bcrypt.hash('Admin@12345', 12);
    const admin = await User.create({
      firstName: 'System',
      lastName:  'Administrator',
      email:     'admin@grandhorizon.example',
      password:  adminPassword,
      role:      'admin',
      phone:     '+251 91 000 0001',
    });
    // Set password directly to bypass the pre-save hook (already hashed above)
    // Actually use the pre-save hook properly:
    const adminUser = new User({
      firstName: 'System',
      lastName:  'Administrator',
      email:     'admin@grandhorizon.example',
      password:  'Admin@12345', // pre-save hook will hash this
      role:      'admin',
      phone:     '+251 91 000 0001',
    });

    // Delete the one we just created and recreate using the model properly
    await User.deleteMany({ email: 'admin@grandhorizon.example' });
    await User.create({
      firstName: 'System',
      lastName:  'Administrator',
      email:     'admin@grandhorizon.example',
      password:  'Admin@12345',
      role:      'admin',
      phone:     '+251 91 000 0001',
    });
    console.log('  ✓ Admin user created');
    console.log('  ✓ Email:    admin@grandhorizon.example');
    console.log('  ✓ Password: Admin@12345');
    console.log('  ⚠  Change this password immediately in production!');

    // Create a sample receptionist
    await User.create({
      firstName: 'Abebe',
      lastName:  'Girma',
      email:     'receptionist@grandhorizon.example',
      password:  'Staff@12345',
      role:      'receptionist',
      phone:     '+251 91 000 0002',
    });
    console.log('  ✓ Receptionist: receptionist@grandhorizon.example / Staff@12345');

    // ─── 3. Room Types ────────────────────────────────────────────────────────
    console.log('\nCreating room types...');
    await RoomType.deleteMany({});

    const roomTypes = await RoomType.insertMany([
      {
        name:        'Standard Double',
        description: 'A comfortable and well-appointed room featuring a double bed, ' +
                     'private bathroom, and all essential amenities. Perfect for ' +
                     'solo travellers or couples seeking great value.',
        basePrice:    2500,   // ETB per night
        capacity:     2,
        amenities:   ['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'En-suite Bathroom',
                      'Mini Fridge', 'Room Service', 'Safe'],
        bedConfiguration: '1 Double Bed',
        sizeSqm:     22,
        minStay:     1,
        images: [{
          url:      'https://placehold.co/800x500/2c5f8a/ffffff?text=Standard+Double',
          publicId: null,
          caption:  'Standard Double Room',
        }],
      },
      {
        name:        'Deluxe King',
        description: 'An elegantly furnished room with a king-size bed, a dedicated ' +
                     'work area, and premium furnishings. Ideal for business travellers ' +
                     'and guests who appreciate extra space and comfort.',
        basePrice:    4200,   // ETB per night
        capacity:     2,
        amenities:   ['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'En-suite Bathroom',
                      'Mini Bar', 'Coffee Machine', 'Bathrobe & Slippers', 'Safe',
                      'Work Desk', 'Room Service'],
        bedConfiguration: '1 King Bed',
        sizeSqm:     35,
        minStay:     1,
        images: [{
          url:      'https://placehold.co/800x500/1a4a70/ffffff?text=Deluxe+King',
          publicId: null,
          caption:  'Deluxe King Room',
        }],
      },
      {
        name:        'Executive Suite',
        description: 'Our most spacious offering — a two-room suite featuring a separate ' +
                     'living area, a luxury king-size bedroom, and a premium bathroom ' +
                     'with both shower and bathtub. Includes complimentary airport transfer.',
        basePrice:    8500,   // ETB per night
        capacity:     4,
        amenities:   ['Free WiFi', 'Air Conditioning', 'Two Flat-screen TVs',
                      'Separate Living Room', 'Jacuzzi Bathtub', 'Mini Bar',
                      'Espresso Machine', 'Bathrobe & Slippers', 'Safe',
                      'Work Desk', '24h Room Service', 'Complimentary Breakfast',
                      'Airport Transfer'],
        bedConfiguration: '1 King Bed + Sofa Bed',
        sizeSqm:     65,
        minStay:     2,   // Suites require minimum 2 nights
        images: [{
          url:      'https://placehold.co/800x500/0f3050/ffffff?text=Executive+Suite',
          publicId: null,
          caption:  'Executive Suite',
        }],
      },
    ]);
    console.log(`  ✓ ${roomTypes.length} room types created`);

    // ─── 4. Individual Rooms ──────────────────────────────────────────────────
    console.log('\nCreating rooms...');
    await Room.deleteMany({});

    const [standard, deluxe, suite] = roomTypes;
    const roomsData = [
      // Floor 1 — Standard rooms
      { roomNumber: '101', floor: 1, roomType: standard._id },
      { roomNumber: '102', floor: 1, roomType: standard._id },
      { roomNumber: '103', floor: 1, roomType: standard._id },
      // Floor 2 — Deluxe rooms
      { roomNumber: '201', floor: 2, roomType: deluxe._id },
      { roomNumber: '202', floor: 2, roomType: deluxe._id },
      { roomNumber: '203', floor: 2, roomType: deluxe._id },
      // Floor 3 — Suites
      { roomNumber: '301', floor: 3, roomType: suite._id },
      { roomNumber: '302', floor: 3, roomType: suite._id },
      // One room under maintenance (realistic scenario)
      { roomNumber: '303', floor: 3, roomType: suite._id, status: 'maintenance',
        notes: 'Bathroom renovation in progress — expected completion Nov 2026' },
    ];

    const rooms = await Room.insertMany(roomsData);
    console.log(`  ✓ ${rooms.length} rooms created`);

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log('\n✅ Seed complete!\n');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│              DEVELOPMENT CREDENTIALS                 │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log('│ Admin:        admin@grandhorizon.example             │');
    console.log('│ Password:     Admin@12345                            │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log('│ Receptionist: receptionist@grandhorizon.example      │');
    console.log('│ Password:     Staff@12345                            │');
    console.log('└─────────────────────────────────────────────────────┘');
    console.log('\n⚠  These are DEVELOPMENT credentials only.');
    console.log('   Use strong, unique passwords in production.\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
