const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Note: In production, hash passwords using bcrypt. Kept simple for DMAC scope.
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, system: user.system },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.json({ token, system: user.system, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
