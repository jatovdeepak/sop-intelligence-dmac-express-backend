// controllers/userController.js
const User = require('../models/User');

// Create a new user (Add User)
exports.createUser = async (req, res) => {
    try {
        const { username, password, system, role } = req.body;
        
        // Note: As per your existing setup, password hashing is skipped for scope.
        // In production, always hash the password using bcrypt here.
        const newUser = new User({ username, password, system, role });
        
        await newUser.save();
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'User created successfully', user: userResponse });
    } catch (err) {
        // Handle duplicate username (MongoDB unique constraint error code 11000)
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(400).json({ error: err.message });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        // Exclude passwords from the results
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an existing user
exports.updateUser = async (req, res) => {
    try {
        // Exclude passwords from being blindly updated here if you want separate password reset logic
        const updateData = { ...req.body };
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};