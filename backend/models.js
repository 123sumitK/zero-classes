
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'], default: 'STUDENT' },
  enrolledCourseIds: [{ type: String }]
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: String, required: true }, // ISO String
  meetLink: { type: String, required: true },
  instructorName: { type: String, required: true },
  price: { type: Number, default: 0 },
  duration: { type: String },
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['PDF', 'SLIDE', 'DOC', 'VIDEO'], required: true },
  url: { type: String, required: true },
  size: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentMethod: { type: String, required: true }, // CARD or UPI
  upiId: { type: String }, // Payer's UPI
  destinationAccount: { type: String, required: true }, // Owner's UPI
  transactionId: { type: String, required: true },
  status: { type: String, default: 'SUCCESS' },
  ownerAccountCredited: { type: Boolean, default: true }, // Simulates transfer to owner
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Course: mongoose.model('Course', courseSchema),
  Material: mongoose.model('Material', materialSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};
