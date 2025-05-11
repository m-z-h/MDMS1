const express = require('express');
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generatePatientPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create patient (nurse only)
router.post('/', auth(['nurse']), async (req, res) => {
  const { name, email, dob, gender, contact } = req.body;
  try {
    if (!name || !email || !dob || !gender || !contact) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format (patients can use any email)
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    let patient = await Patient.findOne({ email });
    if (patient) return res.status(400).json({ message: 'Patient already exists' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already used in system' });

    // Use nurse's hospital and department
    const hospital = req.user.hospital;
    const department = req.user.department;

    patient = new Patient({
      name,
      email,
      dob,
      gender,
      contact,
      hospital,
      department,
      createdBy: req.user.id
    });
    await patient.save();

    // Create user account for patient
    const password = Math.random().toString(36).slice(-8); // Random 8-char password
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      email,
      password: hashedPassword,
      role: 'patient'
    });
    await user.save();

    // Generate PDF
    const pdfDir = path.join(__dirname, '..', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const pdfPath = path.join(pdfDir, `${patient._id}.pdf`);
    await generatePatientPDF(patient, { email, password }, hospital, pdfPath);
    const pdfUrl = `/api/patient/pdf/${patient._id}`;

    res.status(201).json({ 
      message: 'Patient registered', 
      patientId: patient._id, 
      patientCredentials: { email, password },
      pdfUrl 
    });
  } catch (error) {
    console.error('Patient register error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Serve PDF
router.get('/pdf/:patientId', auth(['nurse', 'doctor']), async (req, res) => {
  try {
    const pdfPath = path.join(__dirname, '..', 'pdfs', `${req.params.patientId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    res.download(pdfPath, `patient-${req.params.patientId}.pdf`);
  } catch (error) {
    console.error('PDF serve error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient details (doctor or patient)
router.get('/:id', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'doctor' && patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const response = req.user.role === 'patient' 
      ? { name: patient.name, email: patient.email }
      : patient;

    res.json(response);
  } catch (error) {
    console.error('Get patient error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patients by hospital (doctor only)
router.get('/hospital/:hospital', auth(['doctor']), async (req, res) => {
  try {
    const { hospital } = req.params;
    if (hospital !== req.user.hospital) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const patients = await Patient.find({ hospital, department: req.user.department });
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;