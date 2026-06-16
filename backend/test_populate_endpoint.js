const axios = require("axios");

const test = async () => {
  try {
    // 1. Log in
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      username: "shreyas.bandekar",
      password: "faculty123",
      college: "VP",
      role: "faculty"
    });
    
    const token = loginRes.data.token;
    console.log("Logged in successfully! Token:", token.slice(0, 15) + "...");

    // 2. Query /k7/populate
    const populateRes = await axios.get("http://localhost:5000/api/msbte/k7/populate", {
      params: {
        academicYear: "2025-26",
        semester: "5",
        departmentId: "69db8810f900bd3e85601fe0",
        divisionId: "69db8824f900bd3e85602054",
        ciannId: "8353",
        courseCode: "CE507"
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("POPULATE API RESPONSE:");
    console.log(JSON.stringify(populateRes.data, null, 2));

  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
};

test();
