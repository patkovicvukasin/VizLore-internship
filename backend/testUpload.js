import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

// 1) login
const loginRes = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'vulo1234@example.com', password: 'vulo1234' })
});
const { token } = await loginRes.json();

// 2) upload
const form = new FormData();
form.append('file', fs.createReadStream('./demo.csv'));
form.append('format', 'both');

const upRes = await fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form
});
const { uploadId } = await upRes.json();
console.log('uploadId =', uploadId);

// 3) poll status
let status;
do {
  const sRes = await fetch(`http://localhost:4000/api/upload/${uploadId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ({ status } = await sRes.json());
  console.log('status =', status);
  await new Promise(r => setTimeout(r, 2000));
} while (status === 'PENDING');
