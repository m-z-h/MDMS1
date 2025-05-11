const express = require('express');
const auth = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { encryptData, decryptData } = require('../utils/abe');
const router = express.Router();

// Create medical record (doctor or nurse)
router.post('/', auth(['doctor', 'nurse']), async (req, res) => {
  const { patientId, data, hospital, department } = req.body;
  try {
    if (!patientId || !data || !hospital || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (req.user.hospital !== hospital || req.user.department !== department) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'nurse' && !data.vitals) {
      return res.status(403).json({ message: 'Nurses can only submit vitals' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { encryptedData, iv } = await encryptData(data, patientId, hospital, department);

    const record = new MedicalRecord({
      patientId,
      data: encryptedData,
      iv,
      hospital,
      department,
      createdBy: req.user.id
    });
    await record.save();

    res.status(201).json(record);
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medical record (nurse for vitals, doctor for all)
router.put('/:id', auth(['doctor', 'nurse']), async (req, res) => {
  const { data } = req.body;
  try {
    if (!data) return res.status(400).json({ message: 'Data is required' });

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (record.hospital !== req.user.hospital || record.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'nurse' && !data.vitals) {
      return res.status(403).json({ message: 'Nurses can only update vitals' });
    }

    const { encryptedData, iv } = await encryptData(data, record.patientId, record.hospital, record.department);
    record.data = encryptedData;
    record.iv = iv;
    await record.save();

    res.json(record);
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical record (doctor or patient)
router.get('/:id', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findById(record.patientId);
      if (patient.email !== req.user.email) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    if (req.user.role === 'doctor' && (record.hospital !== req.user.hospital || record.department !== req.user.department)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const decryptedData = await decryptData(record.data, record.iv, record.patientId, record.hospital, record.department);
    const response = { ...record.toObject(), data: decryptedData };

    if (req.user.role === 'patient') {
      res.json({ patientId: response.patientId, data: { vitals: decryptedData.vitals || {} } });
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all medical records for a patient (patient only)
router.get('/patient/:id', auth(['patient']), async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const patient = await Patient.findOne({ email: req.user.email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const records = await MedicalRecord.find({ patientId: patient._id });
    const decryptedRecords = await Promise.all(records.map(async record => {
      const decryptedData = await decryptData(record.data, record.iv, record.patientId, record.hospital, record.department);
      return {
        ...record.toObject(),
        data: { vitals: decryptedData.vitals || {} }
      };
    }));

    res.json(decryptedRecords);
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;