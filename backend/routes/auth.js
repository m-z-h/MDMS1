const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const auth = require('../middleware/auth');
const router = express.Router();

const hospitalEmailDomains = {
  'Manipal Hospital': 'manipalhospital.com',
  'Genesis Hospital': 'genesishospital.com',
  'Fortis Hospital': 'fortishospital.com',
  'Apollo Hospital': 'apollohospital.com',
  'Ruby General Hospital': 'rubyhospital.com'
};

// Register
router.post('/register', async (req, res) => {
  const { email, password, role, hospital, department } = req.body;

  try {
    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }
    if (role !== 'doctor' && role !== 'nurse') {
      return res.status(400).json({ message: 'Only doctor or nurse roles can register' });
    }
    if (!hospital || !department) {
      return res.status(400).json({ message: 'Hospital and department are required for doctor/nurse' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Validate email domain matches hospital
    const emailDomain = email.split('@')[1];
    const expectedDomain = hospitalEmailDomains[hospital];
    if (!expectedDomain || emailDomain !== expectedDomain) {
      return res.status(400).json({ message: `Email domain must be @${expectedDomain} for ${hospital}` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    user = new User({ email, password: hashedPassword, role, hospital, department });
    await user.save();

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign(
      { id: user._id, role, hospital, department },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, user: { id: user._id, email, role, hospital, department } });
  } catch (error) {
    console.error('Register error:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Verify MongoDB connection
    if (!require('mongoose').connection.readyState) {
      throw new Error('MongoDB is not connected');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    if (!user.password) {
      throw new Error('User password is missing or corrupted');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, hospital: user.hospital, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user._id, email, role: user.role, hospital: user.hospital, department: user.department } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Logout
router.post('/logout', auth(), async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Blacklist token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await BlacklistedToken.create({
      token,
      expiresAt: new Date(decoded.exp * 1000)
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;