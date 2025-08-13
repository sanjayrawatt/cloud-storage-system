// controllers/contactController.js

import nodemailer from 'nodemailer';

export const handleContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Set up the Nodemailer transporter using the same credentials as before
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Your App Password
    },
  });

  // 1. Email options for the email sent TO YOU (the admin)
  const mailToAdmin = {
    from: `"${name}" <${email}>`, // Shows the user's name and email as the sender
    to: process.env.ADMIN_EMAIL, // Your email address from .env
    subject: `New Contact Message from CloudStore`,
    html: `
      <h2>New Message from Your Website Contact Form</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  // 2. Email options for the automated reply TO THE USER
  const mailToUser = {
    from: '"CloudStore Support" <no-reply@cloudstore.com>',
    to: email,
    subject: 'We have received your message!',
    html: `
      <h2>Thank You For Contacting Us!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for your message. We have received it and will get back to you as soon as possible.</p>
      <br>
      <p>Best regards,</p>
      <p>The CloudStore Team</p>
    `,
  };

  try {
    // Send both emails
    await transporter.sendMail(mailToAdmin);
    await transporter.sendMail(mailToUser);
    
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
};
