const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    // Check if student user already exists
    const existingStudent = await User.findOne({ 
      username: 'student.test', 
      college: 'VP',
      role: 'student'
    });

    if (existingStudent) {
      console.log('Student user already exists');
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const plainPassword = 'student123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Create student user
    const studentUser = new User({
      username: 'student.test',
      password: hashedPassword,
      college: 'VP',
      role: 'student'
    });

    await studentUser.save();
    console.log('Student user created successfully!');
    console.log('Username: student.test');
    console.log('Password: student123');
    console.log('College: VP');
    console.log('Role: student');

  } catch (error) {
    console.error('Error creating student user:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
});