const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

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
      req.user = decoded; // { id, role, hospital, department }

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