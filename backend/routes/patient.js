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

    if (!hospital || !department) {
      return res.status(400).json({ message: 'Nurse must have hospital and department assigned' });
    }

    // Create new patient without saving
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

    try {
      await patient.save();
    } catch (error) {
      console.error('Patient save error:', error);
      if (error.message.includes('Failed to generate patient ID')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ message: 'Patient ID or email already exists' });
      }
      throw error; // Re-throw other errors to be caught by the outer try-catch
    }

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

// Get patient details (doctor, nurse, or patient)
router.get('/:id', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if ((req.user.role === 'doctor' || req.user.role === 'nurse') && patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const response = req.user.role === 'patient' 
      ? { 
          _id: patient._id,
          name: patient.name, 
          email: patient.email,
          dob: patient.dob,
          gender: patient.gender,
          contact: patient.contact,
          hospital: patient.hospital,
          department: patient.department
        }
      : patient;

    res.json(response);
  } catch (error) {
    console.error('Get patient error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient details (doctor or nurse)
router.put('/:id', auth(['doctor', 'nurse']), async (req, res) => {
  const { name, email, dob, gender, contact } = req.body;
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    // Nurses can only update limited fields
    if (req.user.role === 'nurse') {
      if (email || dob || gender) {
        return res.status(403).json({ message: 'Nurses can only update name and contact' });
      }
      patient.name = name || patient.name;
      patient.contact = contact || patient.contact;
    } else {
      // Doctors can update all fields
      patient.name = name || patient.name;
      patient.email = email || patient.email;
      patient.dob = dob || patient.dob;
      patient.gender = gender || patient.gender;
      patient.contact = contact || patient.contact;
    }

    await patient.save();
    res.json({ message: 'Patient updated successfully', patient });
  } catch (error) {
    console.error('Update patient error:', error.message, error.stack);
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

// Get patient by email (doctor, nurse, or patient)
router.get('/by-email/:email', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const patient = await Patient.findOne({ email: req.params.email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if ((req.user.role === 'doctor' || req.user.role === 'nurse') && patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const response = req.user.role === 'patient' 
      ? { 
          _id: patient._id,
          name: patient.name, 
          email: patient.email,
          dob: patient.dob,
          gender: patient.gender,
          contact: patient.contact,
          hospital: patient.hospital,
          department: patient.department
        }
      : patient;

    res.json(response);
  } catch (error) {
    console.error('Get patient by email error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;