import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'nurse',
    hospital: 'Manipal Hospital',
    department: 'ortho'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const hospitalEmailDomains = {
    'Manipal Hospital': 'manipalhospital.com',
    'Genesis Hospital': 'genesishospital.com',
    'Fortis Hospital': 'fortishospital.com',
    'Apollo Hospital': 'apollohospital.com',
    'Ruby General Hospital': 'rubyhospital.com'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate email domain matches hospital
    const emailDomain = formData.email.split('@')[1];
    const expectedDomain = hospitalEmailDomains[formData.hospital];
    if (emailDomain !== expectedDomain) {
      setError(`Email domain must be @${expectedDomain} for ${formData.hospital}`);
      return;
    }
    try {
      const response = await register(formData);
      localStorage.setItem('token', response.token); // Store token
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          placeholder="Email (e.g., nurse@manipalhospital.com)"
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
        </select>
        <select
          name="hospital"
          value={formData.hospital}
          onChange={handleChange}
          className="w-full p-2 mb-2 border"
          required
        >
          <option value="Manipal Hospital">Manipal Hospital</option>
          <option value="Genesis Hospital">Genesis Hospital</option>
          <option value="Fortis Hospital">Fortis Hospital</option>
          <option value="Apollo Hospital">Apollo Hospital</option>
          <option value="Ruby General Hospital">Ruby General Hospital</option>
        </select>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full p-2 mb-2 border"
          required
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
      <p className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login here</Link>
      </p>
    </div>
  );
}

export default Register;