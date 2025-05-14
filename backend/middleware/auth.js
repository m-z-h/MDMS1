const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');
const User = require('../models/User');

module.exports = function (roles = []) {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const blacklisted = await BlacklistedToken.findOne({ token });
      if (blacklisted) {
        return res.status(401).json({ message: 'Token is invalid' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get full user data from database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        hospital: user.hospital,
        department: user.department
      };

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};