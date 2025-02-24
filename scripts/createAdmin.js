const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
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

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (!existingAdmin) {
      const admin = await User.create(adminData);
      console.log('Admin user created successfully:', admin.email);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdminUser();