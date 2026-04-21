const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Health Check Route
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Email Server is Live', 
    timestamp: new Date().toISOString()
  });
});

// Contact Route (Email Only)
app.post('/api/contact', async (req, res) => {
  console.log('Received contact request:', req.body);
  const { name, businessName, email, phone, service, message } = req.body;

  try {
    // Prepare Emails
    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.HOSPITAL_EMAIL,
      subject: `New Inquiry: ${name} - PineCode Solutions`,
      html: `
        <h3>New Project Inquiry</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Business:</strong> ${businessName || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Service Needed:</strong> ${service}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };

    const userMail = {
      from: `"PineCode Solutions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thank you for reaching out to PineCode Solutions!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0a2f1f; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Message Received</h1>
          </div>
          <div style="padding: 30px;">
            <p>Hello ${name},</p>
            <p>We've received your inquiry about <strong>${service}</strong>. Our team will contact you within 24 hours.</p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px;">
              <strong>Privacy:</strong> Your business data is secure and will never be shared.
            </p>
            <p>Best regards,<br><strong>The PineCode Team</strong></p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail)
    ]);
    
    console.log('Emails sent successfully to:', email);
    res.status(200).json({ success: true, message: 'Emails sent successfully!' });

  } catch (error) {
    console.error('Nodemailer Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Email server running on port ${PORT}`));
