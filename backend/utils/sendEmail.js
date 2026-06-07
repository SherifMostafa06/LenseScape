// utils/sendEmail.js — Wrapper around Nodemailer transporter
const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_gmail')) {
    console.warn('⚠️  Email not configured — skipping send.');
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from: `"LensSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️  Email sent → ${to}`);
};

module.exports = sendEmail;
