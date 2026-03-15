const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Create JWT with role + system
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        system: user.system,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Send response
    res.json({
      token,
      system: user.system,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Add this new function
exports.extendSession = async (req, res) => {
  try {
    // Because this route will use your `authenticate` middleware, 
    // req.user is already decoded and verified!
    const user = req.user; 

    // Generate a fresh token with a reset timer (e.g., another 1 hour)
    const newToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        system: user.system,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Reset the clock to 1 hour
    );

    res.json({ token: newToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extend session' });
  }
};