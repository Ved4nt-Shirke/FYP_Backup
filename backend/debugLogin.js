const mongoose = require('mongoose');
const User = require('./models/user');

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vidyalankarDB';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Test different search approaches
    console.log('=== Testing different search approaches ===');
    
    // Exact search
    console.log('\n1. Exact search for student.test with VP and student role:');
    const exactSearch = await User.findOne({ 
      username: 'student.test', 
      college: 'VP',
      role: 'student'
    });
    console.log('Exact search result:', exactSearch);
    
    // Case insensitive search
    console.log('\n2. Case insensitive search:');
    const caseInsensitiveSearch = await User.findOne({
      username: { $regex: new RegExp('^student.test$', 'i') },
      college: 'VP',
      role: 'student'
    });
    console.log('Case insensitive search result:', caseInsensitiveSearch);
    
    // Search with just username
    console.log('\n3. Search with just username:');
    const usernameOnlySearch = await User.findOne({ 
      username: 'student.test'
    });
    console.log('Username only search result:', usernameOnlySearch);
    
    // List all users with their exact field values
    console.log('\n4. All users with exact field values:');
    const allUsers = await User.find({});
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Username: "${user.username}"`);
      console.log(`  College: "${user.college}"`);
      console.log(`  Role: "${user.role}"`);
      console.log(`  Username length: ${user.username.length}`);
      console.log(`  College length: ${user.college.length}`);
      console.log(`  Role length: ${user.role.length}`);
    });
    
    // Try trimming whitespace
    console.log('\n5. Search with trimmed values:');
    const trimmedSearch = await User.findOne({ 
      username: 'student.test'.trim(), 
      college: 'VP'.trim(),
      role: 'student'.trim()
    });
    console.log('Trimmed search result:', trimmedSearch);

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
});