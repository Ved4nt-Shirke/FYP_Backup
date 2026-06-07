const axios = require('axios');

// Test login directly
const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'student.test',
      password: 'student123',
      college: 'VP',
      role: 'student'
    });

    console.log('Login successful:', response.data);
  } catch (error) {
    console.log('Login failed:', error.response?.data || error.message);
  }
};

testLogin();