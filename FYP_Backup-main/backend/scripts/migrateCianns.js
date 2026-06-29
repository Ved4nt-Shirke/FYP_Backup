/**
 * Migration Script: Add ownerId to existing CIANNs
 * 
 * This script updates all existing CIANN records in the database to include
 * an ownerId field. CIANNs without an owner will be assigned to the first
 * admin/superadmin user found, or you can specify a specific user ID.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Ciann = require('../models/Ciann');
const User = require('../models/user');

async function migrateCianns() {
  try {
    console.log('🚀 Starting CIANN migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidyalankarDB');
    console.log('✅ Connected to MongoDB');

    // Find all CIANNs without ownerId
    const ciannsWithoutOwner = await Ciann.find({ ownerId: { $exists: false } }).setOptions({ __skipTenant: true });
    console.log(`📊 Found ${ciannsWithoutOwner.length} CIANNs without owner`);

    if (ciannsWithoutOwner.length === 0) {
      console.log('✨ All CIANNs already have owners!');
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

    // Update all CIANNs without owner
    const bulkOps = ciannsWithoutOwner.map(ciann => ({
      updateOne: {
        filter: { _id: ciann._id },
        update: { $set: { ownerId: adminUser._id } }
      }
    }));

    if (bulkOps.length > 0) {
      const result = await mongoose.connection.collection('cianns').bulkWrite(bulkOps);
      console.log(`✅ Updated ${result.modifiedCount} CIANN records`);
    }

    // Verify the migration
    const remainingWithoutOwner = await Ciann.find({ 
      ownerId: { $exists: false } 
    }).setOptions({ __skipTenant: true });
    
    if (remainingWithoutOwner.length === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log(`   All ${ciannsWithoutOwner.length} CIANNs now have owners`);
    } else {
      console.warn(`⚠️  Warning: ${remainingWithoutOwner.length} CIANNs still without owner`);
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
migrateCianns();
