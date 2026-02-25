require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const SOP = require('./models/SOP');

// Ensure MongoDB URI is loaded
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dmac';

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DMAC Database. Starting seed process...');

        // 1. Clear existing data to prevent duplicates
        await User.deleteMany({});
        await SOP.deleteMany({});
        console.log('Cleared existing Users and SOPs.');

        // 2. Create Test Users
        const users = await User.create([
            {
                username: 'sop_Operator_1',
                password: 'password123', // Keeping it simple for testing
                system: 'SOP_Intelligence',
                role: 'Operator'
            },
            {
                username: 'stem_admin_1',
                password: 'password123',
                system: 'STEM',
                role: 'Admin'
            },
            {
                username: 'stem_operator_1',
                password: 'password123',
                system: 'STEM',
                role: 'Operator'
            }
        ]);
        console.log(`Created ${users.length} test users.`);

        // 3. Create Test SOPs
        const sops = await SOP.create([
            {
                title: 'Emergency Server Reboot Protocol',
                content: { step1: 'Assess load', step2: 'Drain traffic', step3: 'Reboot' },
                status: 'Active',
                requiredRoles: ['Admin', 'Operator'], // Both STEM roles can see this
                ownerSystem: 'SOP_Intelligence'
            },
            {
                title: 'Database Migration Strategy',
                content: { step1: 'Backup', step2: 'Migrate', step3: 'Verify' },
                status: 'Active',
                requiredRoles: ['Admin'], // ONLY the STEM Manager can see this
                ownerSystem: 'SOP_Intelligence'
            },
            {
                title: 'New API Gateway Setup (WIP)',
                content: { note: 'Still writing this...' },
                status: 'Draft',
                requiredRoles: ['Operator', 'Admin'], // Even though Manager is listed, DMAC will block STEM because it's a 'Draft'
                ownerSystem: 'SOP_Intelligence'
            }
        ]);
        console.log(`Created ${sops.length} test SOPs.`);

        console.log('Database seeding completed successfully!');
        process.exit();

    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase();