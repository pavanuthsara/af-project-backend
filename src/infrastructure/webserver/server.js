const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');

const app = express();
app.use(express.json());

// Connect DB
connectToDatabase();

// Routes
const signUpController = new SignUpController();
app.post('/signup', (req, res) => signUpController.handle(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});