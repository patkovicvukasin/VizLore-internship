// 1. Uvoz biblioteka koje smo instalirali
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// 2. Pokrećemo Express aplikaciju
const app = express();

// 3. Middleware - omogućavamo JSON i CORS podršku
app.use(bodyParser.json());
app.use(cors());

// 4. Konekcija na lokalni MongoDB (Docker)
mongoose.connect('mongodb://localhost:27017/students');


// 5. Definicija Mongoose modela (kao Entity klasa u Javi)
const User = mongoose.model('User', {
  name: String,
  age: Number,
  email: String
});

// 6. Rute

// GET /users – svi korisnici
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// POST /users – dodavanje korisnika
app.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

// PUT /users/:id – izmena korisnika
app.put('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

// DELETE /users/:id – brisanje korisnika
app.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// 7. Pokretanje servera
app.listen(3000, () => console.log('✅ Server radi na http://localhost:3000'));
