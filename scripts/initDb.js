const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to database');

    // Create admin user
    const adminData = {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@backbook.com',
      password: 'Admin123!@#',
      passwordConfirm: 'Admin123!@#',
      role: 'admin',
      verified: true,
      confirmed: true
    };

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (!existingAdmin) {
      const admin = await User.create(adminData);
      console.log('Admin user created:', admin.email);
    } else {
      // Update admin password if needed
      existingAdmin.password = adminData.password;
      existingAdmin.passwordConfirm = adminData.password;
      await existingAdmin.save();
      console.log('Admin user updated:', existingAdmin.email);
    }

    // Create test user
    const testData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@backbook.com',
      password: 'Test123!@#',
      passwordConfirm: 'Test123!@#',
      role: 'user',
      verified: true,
      confirmed: true
    };

    const existingTest = await User.findOne({ email: testData.email });
    
    if (!existingTest) {
      const test = await User.create(testData);
      console.log('Test user created:', test.email);
    }

  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase();