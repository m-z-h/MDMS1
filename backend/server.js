require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const medicalRecordRoutes = require('./routes/medicalRecord');
const assignmentRoutes = require('./routes/assignment');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/medical-record', medicalRecordRoutes);
app.use('/api/assignment', assignmentRoutes);

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));