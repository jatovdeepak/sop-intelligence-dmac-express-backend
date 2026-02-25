require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users
    await User.deleteMany();

    const salt = await bcrypt.genSalt(10);

    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', salt),
        system: 'Admin',
        role: 'Admin',
      },
      {
        username: 'supervisor1',
        password: await bcrypt.hash('supervisor123', salt),
        system: 'SOP_Intelligence',
        role: 'Supervisor',
      },
      {
        username: 'operator1',
        password: await bcrypt.hash('operator123', salt),
        system: 'STEM',
        role: 'Operator',
      },
      {
        username: 'qa1',
        password: await bcrypt.hash('qa123', salt),
        system: 'SOP_Intelligence',
        role: 'QA',
      }
    ];

    await User.insertMany(users);

    console.log('✅ Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();