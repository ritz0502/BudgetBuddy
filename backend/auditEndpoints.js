const axios = require('axios');
const mongoose = require('mongoose');

async function runTests() {
  let token = null;
  try {
    // 1. Get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testuser_1782273847868@example.com',
      password: 'Password123!'
    });
    token = loginRes.data.token;
    console.log("✅ Logged in successfully");
  } catch(e) {
    console.log("❌ Error logging in", e.response?.data || e.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Test GET /api/scholarships
  let scholarshipId = null;
  try {
    const res = await axios.get('http://localhost:5000/api/scholarships', { headers });
    console.log(`✅ GET /api/scholarships returned ${res.data.scholarships?.length || 0} items`);
    if(res.data.scholarships && res.data.scholarships.length > 0) {
      scholarshipId = res.data.scholarships[0]._id;
    }
  } catch(e) {
    console.log("❌ Error GET /api/scholarships", e.response?.data || e.message);
  }

  // 3. Test GET /api/scholarships?search=engineering
  try {
    const res = await axios.get('http://localhost:5000/api/scholarships?search=engineering', { headers });
    console.log(`✅ GET /api/scholarships?search=engineering returned ${res.data.scholarships?.length || 0} items`);
  } catch(e) {
    console.log("❌ Error GET /api/scholarships?search=engineering", e.response?.data || e.message);
  }

  if (scholarshipId) {
    // 4. Test POST /api/scholarships/:id/bookmark
    try {
      const res = await axios.post(`http://localhost:5000/api/scholarships/${scholarshipId}/bookmark`, {}, { headers });
      console.log(`✅ POST bookmark toggled: ${res.data.message}`);
    } catch(e) {
      console.log("❌ Error toggling bookmark", e.response?.data || e.message);
    }
  }

  // 5. Test GET /api/scholarships/bookmarks
  try {
    const res = await axios.get('http://localhost:5000/api/scholarships/bookmarks', { headers });
    console.log(`✅ GET /api/scholarships/bookmarks returned ${res.data.length || 0} items`);
  } catch(e) {
    console.log("❌ Error fetching bookmarks", e.response?.data || e.message);
  }
}

runTests();
