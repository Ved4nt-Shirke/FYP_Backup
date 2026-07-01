/**
 * Migration Script: Add ownerId to existing Ciaans
 * 
 * This script updates all existing Ciaan records in the database to include
 * an ownerId field. Ciaans without an owner will be assigned to the first
 * admin/superadmin user found, or you can specify a specific user ID.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Ciaan = require('../models/Ciann');
const User = require('../models/user');

async function migrateCiaans() {
  try {
    console.log('🚀 Starting Ciaan migration...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidyalankarDB');
    console.log('✅ Connected to MongoDB');

    // Find all Ciaans without ownerId
    const CiaansWithoutOwner = await Ciaan.find({ ownerId: { $exists: false } }).setOptions({ __skipTenant: true });
    console.log(`📊 Found ${CiaansWithoutOwner.length} Ciaans without owner`);

    if (CiaansWithoutOwner.length === 0) {
      console.log('✨ All Ciaans already have owners!');
      process.exit(0);
    }

    // Find the first admin or superadmin user
    const adminUser = await User.findOne({
      role: { $in: ['admin', 'superadmin', 'office'] }
    }).sort({ createdAt: 1 });

    if (!adminUser) {
      console.error('❌ No admin/superadmin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`👤 Using user: ${adminUser.username} (${adminUser.role}) as default owner`);
    console.log(`   User ID: ${adminUser._id}`);

    // Update all Ciaans without owner
    const bulkOps = CiaansWithoutOwner.map(Ciaan => ({
      updateOne: {
        filter: { _id: Ciaan._id },
        update: { $set: { ownerId: adminUser._id } }
      }
    }));

    if (bulkOps.length > 0) {
      const result = await mongoose.connection.collection('Ciaans').bulkWrite(bulkOps);
      console.log(`✅ Updated ${result.modifiedCount} Ciaan records`);
    }

    // Verify the migration
    const remainingWithoutOwner = await Ciaan.find({
      ownerId: { $exists: false }
    }).setOptions({ __skipTenant: true });

    if (remainingWithoutOwner.length === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log(`   All ${CiaansWithoutOwner.length} Ciaans now have owners`);
    } else {
      console.warn(`⚠️  Warning: ${remainingWithoutOwner.length} Ciaans still without owner`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateCiaans();
