// config/email.js — Nodemailer transporter (Gmail SMTP)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use a Gmail App Password, not your real password
  },
});

module.exports = transporter;
