import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'nurse',
    hospital: 'hospital1',
    department: 'ortho'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Register</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email (e.g., nurse@hospital1.com)"
          className="w-full p-2 mb-2 border"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-2 mb-2 border"
          required
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-2 mb-2 border"
          required
        >
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="patient">Patient</option>
        </select>
        <select
          name="hospital"
          value={formData.hospital}
          onChange={handleChange}
          className="w-full p-2 mb-2 border"
          required
        >
          <option value="hospital1">Hospital 1</option>
          <option value="hospital2">Hospital 2</option>
          <option value="hospital3">Hospital 3</option>
          <option value="hospital4">Hospital 4</option>
          <option value="hospital5">Hospital 5</option>
        </select>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full p-2 mb-2 border"
          disabled={formData.role === 'patient'}
          required={formData.role !== 'patient'}
        >
          <option value="">Select Department</option>
          <option value="ortho">Orthopedics</option>
          <option value="cardio">Cardiology</option>
          <option value="neuro">Neurology</option>
          <option value="onco">Oncology</option>
          <option value="general">General</option>
        </select>
        <button type="submit" className="w-full p-2 bg-blue-500 text-white">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;