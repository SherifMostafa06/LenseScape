// config/db.js — MongoDB Atlas connection
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri || uri.includes('REPLACE_') || uri.includes('@cluster0.mongodb.net')) {
    console.error(
      '❌ Invalid MONGO_URI in .env — use your full Atlas host (e.g. cluster0.xxxxx.mongodb.net), not cluster0.mongodb.net'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
