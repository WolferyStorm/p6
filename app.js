const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()
const sauce = require('./models/sauce');
const userRoutes = require('./routes/user');

mongoose.connect(process.env.SECRET_MDB,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});
app.use('/api/sauces', (req, res, next) => {
  sauce.find()
    .then(things => res.status(200).json(things))
    .catch(error => res.status(400).json({ error }));
});
app.use(express.json());
app.use('/api/auth', userRoutes);

module.exports = app;