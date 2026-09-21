const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No admin token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sadhana_secret_key_2026');

    if (decoded.isAdmin === true) {
      // Token explicitly asserts admin state
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};
