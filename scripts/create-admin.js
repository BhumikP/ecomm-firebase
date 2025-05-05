// scripts/create-admin.js
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User').default; // Adjust path if necessary

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'admin@example.com'; // Default admin email
const ADMIN_PASSWORD = 'password'; // Default admin password - CHANGE THIS
const SALT_ROUNDS = 10;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Optional: Disable command buffering
      serverSelectionTimeoutMS: 5000 // Optional: Timeout after 5s instead of 30s
    });
    console.log('MongoDB connected successfully.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`Admin user with email ${ADMIN_EMAIL} already exists.`);
      mongoose.connection.close();
      return;
    }

    console.log(`Creating admin user: ${ADMIN_EMAIL}`);
    // Hash the password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    // Create new admin user
    const adminUser = new User({
      name: 'Admin User', // Default name
      email: ADMIN_EMAIL,
      passwordHash: passwordHash,
      role: 'admin', // Set role to admin
      joinedDate: new Date(),
      status: 'Active'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('---');
    console.log('Admin Credentials:');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('---');
    console.log('IMPORTANT: Remember to change the default password after logging in for the first time!');


  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1); // Exit with error code
  } finally {
     // Ensure connection is closed
     if (mongoose.connection.readyState === 1) {
       await mongoose.connection.close();
       console.log('MongoDB connection closed.');
     }
  }
}

createAdminUser();
