const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pinecode_leads')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Routes
app.post('/api/contact', async (req, res) => {
  const { name, businessName, email, phone, service, message } = req.body;

  try {
    // 1. Save to MongoDB
    const newContact = new Contact({ name, businessName, email, phone, service, message });
    await newContact.save();

    // 2. Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.HOSPITAL_EMAIL, // Target email from .env
      subject: `New Inquiry from ${name} - PineCode Solutions`,
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

    await transporter.sendMail(mailOptions);

    // 3. Send Confirmation Email to User
    const userMailOptions = {
      from: `"PineCode Solutions" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thank you for reaching out to PineCode Solutions!`,
      html: `
        <div style="font-family: sans-serif; color: #12160f; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0a2f1f; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Message Received</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="margin-top: 0;">Hello ${name},</h2>
            <p style="line-height: 1.6; color: #4b5563;">Thank you for reaching out to <strong>PineCode Solutions</strong>. We've received your inquiry about <strong>${service}</strong> and our team is already reviewing it.</p>
            <p style="line-height: 1.6; color: #4b5563;">One of our experts will contact you within the next 24 hours to discuss your project in detail.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Privacy Commitment:</strong> Your data is secure with us. We use industry-standard encryption and never share your business information with third parties.
              </p>
            </div>

            <p style="margin-bottom: 0;">Best regards,</p>
            <p style="margin-top: 5px; font-weight: bold; color: #0a2f1f;">The PineCode Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Jammu, J&K | pinecode47@gmail.com</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(userMailOptions);

    res.status(200).json({ success: true, message: 'Message sent and saved!' });
  } catch (error) {
    console.error('Error handling contact form:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
