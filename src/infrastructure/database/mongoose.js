const mongoose = require('mongoose');
require('dotenv').config();

const connectToDatabase = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in .env');
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectToDatabase;