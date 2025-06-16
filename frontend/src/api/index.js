import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

const api = {
  register: (email, password, confirmPassword) =>
    instance.post('/auth/register', { email, password, confirmPassword }),
  login: (email, password) =>
    instance.post('/auth/login', { email, password }),
  upload: (formData, token) =>
    instance.post(
      '/upload',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    ),
  status: (id, token) =>
    instance.get(
      `/upload/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),
};

export default api;
