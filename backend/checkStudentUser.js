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
    // Check if student user exists
    const studentUsers = await User.find({ 
      role: 'student'
    });

    console.log('All student users in database:');
    console.log(studentUsers);

    // Check specifically for our test student
    const testStudent = await User.findOne({ 
      username: 'student.test', 
      college: 'VP',
      role: 'student'
    });

    if (testStudent) {
      console.log('Test student user found:');
      console.log({
        username: testStudent.username,
        college: testStudent.college,
        role: testStudent.role
      });
    } else {
      console.log('Test student user NOT found');
    }

    // Check all users
    const allUsers = await User.find({});
    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log({
        username: user.username,
        college: user.college,
        role: user.role
      });
    });

  } catch (error) {
    console.error('Error checking student user:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
});