const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// Middleware - Optimized for Production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('CRITICAL: MongoDB connection error:', err));

// Contact Model
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  businessName: String,
  email: { type: String, required: true },
  phone: String,
  service: String,
  message: String,
  date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', ContactSchema);

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
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'Server is Live', 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.post('/api/contact', async (req, res) => {
  console.log('Received contact request:', req.body);
  const { name, businessName, email, phone, service, message } = req.body;

  try {
    // 1. Save to MongoDB
    const newContact = new Contact({ name, businessName, email, phone, service, message });
    await newContact.save();
    console.log('Saved to MongoDB');

    // 2. Prepare Emails
    const adminMail = {
      from: process.env.EMAIL_USER,
      to: process.env.HOSPITAL_EMAIL,
      subject: `New Inquiry: ${name} - PineCode Solutions`,
      html: `<h3>New Project Inquiry</h3><p><strong>Name:</strong> ${name}</p><p><strong>Service:</strong> ${service}</p><p><strong>Message:</strong> ${message}</p>`
    };

    const userMail = {
      from: `"PineCode Solutions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We've received your message!`,
      html: `<h2>Hello ${name},</h2><p>Thanks for contacting PineCode. Our team will reach out within 24 hours.</p><p>Your data is secure with us.</p>`
    };

    // 3. Send both emails in parallel for speed
    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail)
    ]);
    
    console.log('Emails sent successfully');
    res.status(200).json({ success: true, message: 'Success' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
