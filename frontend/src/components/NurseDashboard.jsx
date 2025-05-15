import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function NurseDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [patientForm, setPatientForm] = useState({ name: '', email: '', dob: '', gender: '', contact: '' });
  const [vitalForm, setVitalForm] = useState({ patientId: '', bloodPressure: '', heartRate: '', temperature: '' });
  const [patientId, setPatientId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', contact: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const navigate = useNavigate();

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_ENDPOINTS.patient, patientForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatientForm({ name: '', email: '', dob: '', gender: '', contact: '' });
      setSuccess(`Patient registered! ID: ${res.data.patientId}, Credentials: ${res.data.patientCredentials.email}/${res.data.patientCredentials.password}`);
      setPdfUrl(res.data.pdfUrl);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient');
      setSuccess('');
      setPdfUrl('');
    }
  };

  const handleVitalSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_ENDPOINTS.medicalRecord, {
        patientId: vitalForm.patientId,
        data: { vitals: {
          bloodPressure: vitalForm.bloodPressure,
          heartRate: vitalForm.heartRate,
          temperature: vitalForm.temperature
        }},
        hospital: user.hospital,
        department: user.department
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVitalForm({ patientId: '', bloodPressure: '', heartRate: '', temperature: '' });
      setSuccess('Vitals updated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vitals');
      setSuccess('');
    }
  };

  const handleFetchPatient = async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.patient}/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatientData(res.data);
      setEditForm({
        name: res.data.name,
        contact: res.data.contact,
      });
      setError('');
      setSuccess('Patient details fetched successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patient');
      setPatientData(null);
      setSuccess('');
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_ENDPOINTS.patient}/${patientId}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatientData(res.data.patient);
      setSuccess('Patient details updated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update patient');
      setSuccess('');
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
        <h1 className="text-3xl font-bold">Nurse Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {pdfUrl && (
        <p className="text-blue-500 mb-4">
                    <a href={`${API_ENDPOINTS.patient}${pdfUrl}`} download className="underline">            Download Patient PDF          </a>
        </p>
      )}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Register Patient</h2>
        <form onSubmit={handlePatientSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              value={patientForm.name}
              onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={patientForm.email}
              onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={patientForm.dob}
              onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Gender</label>
            <select
              value={patientForm.gender}
              onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Contact</label>
            <input
              type="text"
              value={patientForm.contact}
              onChange={(e) => setPatientForm({ ...patientForm, contact: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Register Patient
          </button>
        </form>
      </div>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Fetch Patient by ID</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            className="w-full px-3 py-2 border rounded mr-2"
          />
          <button
            onClick={handleFetchPatient}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Fetch
          </button>
        </div>
        {patientData && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Patient Details</h3>
            <p>Name: {patientData.name}</p>
            <p>Email: {patientData.email}</p>
            <p>Date of Birth: {new Date(patientData.dob).toLocaleDateString()}</p>
            <p>Gender: {patientData.gender}</p>
            <p>Contact: {patientData.contact}</p>
            <p>Hospital: {patientData.hospital}</p>
            <p>Department: {patientData.department}</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">Edit Patient</h3>
            <form onSubmit={handleEditPatient}>
              <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Contact</label>
                <input
                  type="text"
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                Update Patient
              </button>
            </form>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Update Vitals</h2>
        <form onSubmit={handleVitalSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Patient ID</label>
            <input
              type="text"
              value={vitalForm.patientId}
              onChange={(e) => setVitalForm({ ...vitalForm, patientId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Blood Pressure</label>
            <input
              type="text"
              value={vitalForm.bloodPressure}
              onChange={(e) => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Heart Rate</label>
            <input
              type="text"
              value={vitalForm.heartRate}
              onChange={(e) => setVitalForm({ ...vitalForm, heartRate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Temperature</label>
            <input
              type="text"
              value={vitalForm.temperature}
              onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Update Vitals
          </button>
        </form>
      </div>
    </div>
  );
}

export default NurseDashboard;