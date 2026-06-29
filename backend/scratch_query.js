const http = require('http');

http.get('http://localhost:5000/api/assessments/students-by-batch?batch=Batch%201&ciannId=4316&division=A', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Raw response:', data);
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
