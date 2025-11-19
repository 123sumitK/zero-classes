
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { User, Course, Material, Transaction } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Configuration ---
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const OWNER_UPI_ID = "9661778393@ikwik";

// Middleware
app.use(cors());
app.use(express.json());

// Temporary In-Memory OTP Store (Use Redis in production)
const otpStore = new Map();

// Connect to MongoDB
if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI is not defined in .env file");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Utility Functions ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmail = async (to, subject, text) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
    return true;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
    await transporter.sendMail({ from: EMAIL_USER, to, subject, text });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Email Send Error:", error);
    return false;
  }
};

// --- Auth & OTP Routes ---

// 1. Send OTP (Email or Phone)
app.post('/api/auth/send-otp', async (req, res) => {
  const { identifier, type } = req.body; // type: 'email' or 'phone'
  const otp = generateOTP();
  otpStore.set(identifier, otp);

  // Expire OTP after 5 mins
  setTimeout(() => otpStore.delete(identifier), 5 * 60 * 1000);

  if (type === 'email') {
    await sendEmail(identifier, 'Zero Classes Verification Code', `Your OTP is: ${otp}`);
    return res.json({ message: 'OTP sent to email' });
  } 
  
  // For Phone: Since we don't have a paid SMS gateway configured yet,
  // we Log it to the server console so you can copy-paste it for testing.
  console.log(`\n📱 [SMS SIMULATION] OTP for ${identifier}: ${otp}\n`);
  return res.json({ message: 'OTP sent to phone (Check Server Console)' });
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { identifier, otp } = req.body;
  const storedOtp = otpStore.get(identifier);

  if (storedOtp && storedOtp === otp) {
    otpStore.delete(identifier); // Verify once
    return res.json({ success: true, message: 'Verified' });
  }
  return res.status(400).json({ success: false, message: 'Invalid or Expired OTP' });
});

// 3. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: 'Phone number already in use' });

    const user = new User({ name, email, phone, password, role });
    await user.save();
    
    const { password: _, ...userSafe } = user.toObject();
    res.status(201).json(userSafe);
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 4. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ 
        $or: [{ email: identifier }, { phone: identifier }] 
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...userSafe } = user.toObject();
    res.json(userSafe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Login via OTP (Phone)
app.post('/api/auth/login-via-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not registered' });

    const { password: _, ...userSafe } = user.toObject();
    res.json(userSafe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Payment Routes (Simulated) ---

app.post('/api/payments/checkout', async (req, res) => {
  try {
    const { userId, courseId, amount, currency, paymentMethod, upiId } = req.body;

    // Simulate processing delay
    // In a real app without Razorpay, you might integrate Stripe or just log manual payments here.
    
    const transaction = new Transaction({
      userId,
      courseId,
      amount,
      currency,
      paymentMethod,
      upiId: paymentMethod === 'UPI' ? upiId : undefined,
      destinationAccount: OWNER_UPI_ID,
      transactionId: 'txn_' + Date.now(),
      status: 'SUCCESS',
      ownerAccountCredited: true
    });
    
    await transaction.save();
    
    // Enroll User
    await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourseIds: courseId } });

    res.json({ success: true, message: 'Payment Recorded' });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

// --- Standard Routes ---

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    const formatted = courses.map(c => ({ ...c.toObject(), id: c._id }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, date, meetLink, instructorName, price, duration, status } = req.body;
    const course = new Course({ title, description, date, meetLink, instructorName, price, duration, status });
    await course.save();
    res.status(201).json({ ...course.toObject(), id: course._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ ...course.toObject(), id: course._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const materials = await Material.find();
    const formatted = materials.map(m => ({ ...m.toObject(), id: m._id }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json({ ...material.toObject(), id: material._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  await sendEmail(EMAIL_USER, req.body.subject, req.body.message);
  res.json({ message: 'Sent' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
