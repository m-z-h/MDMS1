const checkAccess = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error in access control' });
    }
  };
};

const checkDepartmentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Patients don't need department check
    if (req.user.role === 'patient') {
      return next();
    }

    // For doctors and nurses, check department match
    if (req.params.department && req.params.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: Not authorized for this department' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in department access control' });
  }
};

const checkPatientAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patientId = req.params.patientId || req.body.patientId;
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Patients can only access their own records
    if (req.user.role === 'patient') {
      if (req.user.patientId !== patientId) {
        return res.status(403).json({ message: 'Access denied: Not authorized to access this patient\'s data' });
      }
      return next();
    }

    // For doctors and nurses, check department match
    const Patient = require('../models/Patient');
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: Patient not in your department' });
    }

    // Add patient to request for later use
    req.patient = patient;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in patient access control' });
  }
};

module.exports = {
  checkAccess,
  checkDepartmentAccess,
  checkPatientAccess
}; 