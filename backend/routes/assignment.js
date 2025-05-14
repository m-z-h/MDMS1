const express = require('express');
const router = express.Router();
const PatientAssignment = require('../models/PatientAssignment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkAccess, checkPatientAccess } = require('../middleware/roleAccess');

// Assign patient to nurse (doctors only)
router.post('/', auth(['doctor']), checkPatientAccess, async (req, res) => {
  try {
    const { nurseId } = req.body;
    const patientId = req.patient._id;

    // Verify nurse exists and is in same department
    const nurse = await User.findOne({
      _id: nurseId,
      role: 'nurse',
      department: req.user.department,
      hospital: req.user.hospital
    });

    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found in your department' });
    }

    // Deactivate any existing assignments for this patient
    await PatientAssignment.updateMany(
      { patientId, active: true },
      { active: false }
    );

    // Create new assignment
    const assignment = new PatientAssignment({
      patientId,
      nurseId,
      assignedBy: req.user.id,
      department: req.user.department,
      hospital: req.user.hospital
    });

    await assignment.save();
    res.status(201).json({ message: 'Patient assigned successfully', assignment });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nurse's assigned patients (nurses only)
router.get('/nurse/patients', auth(['nurse']), async (req, res) => {
  try {
    const assignments = await PatientAssignment.find({
      nurseId: req.user.id,
      active: true
    })
    .populate('patientId', '-__v')
    .sort('-assignedAt');

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's assigned nurse (doctors, nurses, patients)
router.get('/patient/:patientId', auth(['doctor', 'nurse', 'patient']), checkPatientAccess, async (req, res) => {
  try {
    const assignment = await PatientAssignment.findOne({
      patientId: req.patient._id,
      active: true
    })
    .populate('nurseId', 'name email department hospital')
    .populate('assignedBy', 'name email department');

    if (!assignment) {
      return res.status(404).json({ message: 'No active nurse assignment found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all assignments in department (doctors only)
router.get('/department', auth(['doctor']), async (req, res) => {
  try {
    const assignments = await PatientAssignment.find({
      department: req.user.department,
      hospital: req.user.hospital,
      active: true
    })
    .populate('patientId', '-__v')
    .populate('nurseId', 'name email')
    .sort('-assignedAt');

    res.json(assignments);
  } catch (error) {
    console.error('Get department assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove assignment (doctors only)
router.delete('/:assignmentId', auth(['doctor']), async (req, res) => {
  try {
    const assignment = await PatientAssignment.findOne({
      _id: req.params.assignmentId,
      department: req.user.department,
      hospital: req.user.hospital,
      active: true
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.active = false;
    await assignment.save();

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 