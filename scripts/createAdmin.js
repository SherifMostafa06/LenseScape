/**
 * scripts/createAdmin.js
 * Run once to create an admin account in the database.
 *
 * Usage:
 *   node scripts/createAdmin.js
 *
 * Or with custom credentials:
 *   ADMIN_NAME="Sherif" ADMIN_EMAIL="admin@test.com" ADMIN_PASS="Admin1234!" node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ADMIN_NAME  = process.env.ADMIN_NAME  || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lensspace.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Admin1234!';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Load User model (after connect so mongoose is ready)
    const User = require('../backend/models/User');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`⚠️  An admin with email "${ADMIN_EMAIL}" already exists.`);
        console.log(`   Name: ${existing.name}`);
        console.log(`   Role: ${existing.role}`);
      } else {
        // Upgrade existing user to admin
        existing.role = 'admin';
        await existing.save();
        console.log(`✅ Upgraded existing user "${existing.name}" to admin role.`);
      }
      await mongoose.disconnect();
      return;
    }

    // Hash password manually (bypassing pre-save hook to avoid double hashing)
    const hashed = await bcrypt.hash(ADMIN_PASS, 12);

    // Create admin user
    const admin = await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      role:     'admin',
    });

    console.log('🎉 Admin account created successfully!\n');
    console.log('┌─────────────────────────────────────┐');
    console.log(`│  Name  : ${admin.name.padEnd(27)}│`);
    console.log(`│  Email : ${ADMIN_EMAIL.padEnd(27)}│`);
    console.log(`│  Pass  : ${ADMIN_PASS.padEnd(27)}│`);
    console.log(`│  Role  : admin                      │`);
    console.log('└─────────────────────────────────────┘');
    console.log('\n👉 You can now log in at http://localhost:3000/login.html');
    console.log('   Then navigate to http://localhost:3000/admin.html\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
