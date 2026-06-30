const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Finance Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    throw error;
  }
};

const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'ইমেইল যাচাই করুন — Finance Tracker',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:8px">
        <h2 style="color:#1f2937">স্বাগতম, ${name}!</h2>
        <p style="color:#4b5563">আপনার Finance Tracker অ্যাকাউন্ট সক্রিয় করতে নিচের বোতামে ক্লিক করুন:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;margin:16px 0">ইমেইল যাচাই করুন</a>
        <p style="color:#9ca3af;font-size:12px">এই লিঙ্ক ২৪ ঘণ্টা পর মেয়াদোত্তীর্ণ হবে।</p>
      </div>`,
  });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'পাসওয়ার্ড রিসেট — Finance Tracker',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:8px">
        <h2 style="color:#1f2937">পাসওয়ার্ড রিসেট</h2>
        <p style="color:#4b5563">প্রিয় ${name}, আপনার পাসওয়ার্ড রিসেট করতে নিচের বোতামে ক্লিক করুন:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:white;text-decoration:none;border-radius:6px;margin:16px 0">পাসওয়ার্ড রিসেট করুন</a>
        <p style="color:#9ca3af;font-size:12px">এই লিঙ্ক ১ ঘণ্টা পর মেয়াদোত্তীর্ণ হবে। আপনি যদি পাসওয়ার্ড রিসেট না করে থাকেন, এই ইমেইল উপেক্ষা করুন।</p>
      </div>`,
  });
};

const sendBudgetAlertEmail = async (email, name, category, spent, limit) => {
  const percent = Math.round((spent / limit) * 100);
  await sendEmail({
    to: email,
    subject: `⚠️ বাজেট সতর্কতা: ${category} — Finance Tracker`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fef3c7;border-radius:8px">
        <h2 style="color:#92400e">⚠️ বাজেট সীমা ছাড়িয়ে যাচ্ছে!</h2>
        <p style="color:#78350f">প্রিয় ${name},</p>
        <p style="color:#78350f"><strong>${category}</strong> ক্যাটাগরিতে আপনার বাজেটের <strong>${percent}%</strong> খরচ হয়ে গেছে।</p>
        <table style="width:100%;background:white;border-radius:6px;padding:16px;border-collapse:collapse">
          <tr><td style="padding:8px;color:#6b7280">বাজেট সীমা:</td><td style="padding:8px;font-weight:bold">৳${limit.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">খরচ হয়েছে:</td><td style="padding:8px;font-weight:bold;color:#ef4444">৳${spent.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#6b7280">অবশিষ্ট:</td><td style="padding:8px;font-weight:bold;color:#10b981">৳${(limit - spent).toLocaleString()}</td></tr>
        </table>
      </div>`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendBudgetAlertEmail };
