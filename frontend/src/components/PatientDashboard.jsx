import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function PatientDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/medical-record/patient/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRecords(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch records');
      }
    };
    fetchRecords();
  }, [user]);

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
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Medical Records</h2>
        {records.length === 0 && <p>No records available.</p>}
        {records.map(record => (
          <div key={record._id} className="mb-4 p-4 border rounded">
            <p><strong>Vitals:</strong> {JSON.stringify(record.data.vitals)}</p>
            <p><strong>Diagnosis:</strong> Restricted</p>
            <p><strong>Treatment:</strong> Restricted</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientDashboard;