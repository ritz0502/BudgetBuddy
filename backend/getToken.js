const axios = require('axios');

async function testAuth() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testuser_1782273847868@example.com',
      password: 'Password123!'
    });
    console.log(loginRes.data.token);
  } catch(e) {
    console.log("Error logging in", e.message);
  }
}
testAuth();
