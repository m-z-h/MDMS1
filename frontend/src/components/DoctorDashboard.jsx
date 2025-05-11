import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function DoctorDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({ patientId: '', vitals: {}, diagnosis: '', treatment: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/patient/hospital/${user.hospital}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPatients(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch patients');
      }
    };
    fetchPatients();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/medical-record', {
        patientId: formData.patientId,
        data: {
          vitals: formData.vitals,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment
        },
        hospital: user.hospital,
        department: user.department
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFormData({ patientId: '', vitals: {}, diagnosis: '', treatment: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create record');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Create Medical Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Patient</label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>{patient.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Blood Pressure</label>
            <input
              type="text"
              value={formData.vitals.bloodPressure || ''}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bloodPressure: e.target.value } })}
              placeholder="Blood Pressure"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Heart Rate</label>
            <input
              type="text"
              value={formData.vitals.heartRate || ''}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, heartRate: e.target.value } })}
              placeholder="Heart Rate"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Temperature</label>
            <input
              type="text"
              value={formData.vitals.temperature || ''}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperature: e.target.value } })}
              placeholder="Temperature"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Diagnosis</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Treatment</label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Create Record
          </button>
        </form>
      </div>
    </div>
  );
}

export default DoctorDashboard;