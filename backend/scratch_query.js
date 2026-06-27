const http = require('http');

http.get('http://localhost:5000/api/assessments/students-by-batch?batch=Batch%201&ciannId=4316&division=A', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Count:', json.count);
      if (json.students) {
        console.log('Students list:');
        json.students.forEach((s, i) => {
          console.log(`${i+1}: ${s.studentName} (Roll: ${s.rollNo})`);
        });
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
