const SOP = require('../models/SOP');
const path = require('path');

// Get all accessible SOPs based on System and Role
exports.getSOPs = async (req, res) => {
  try {
    let filter = {};

    // If STEM is calling, only show Active SOPs that match their role
    if (req.user.system === 'STEM') {
      filter.status = 'Active';
      filter.requiredRoles = req.user.role;
    }

    const sops = await SOP.find(filter).select('-__v');
    res.json(sops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get specific SOP (Middleware handles conditions and audit logging)
exports.getSOPById = async (req, res) => {
  try {
      const sop = req.requestedSOP;

      // NEW LOGIC: Allow if role is in the array, OR if the user is an Admin/Operator
      if (!sop.requiredRoles.includes(req.user.role) && req.user.role !== 'Admin' && req.user.role !== 'Operator') {
          return res.status(403).json({ message: 'You do not have the required role to view this specific SOP.' });
      }

      res.json(sop);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

// Created by SOP Intelligence
exports.createSOP = async (req, res) => {
  try {
      // If content is sent as a stringified JSON (due to form-data), parse it
      const sopData = {
          ...req.body,
          content: typeof req.body.content === 'string' ? JSON.parse(req.body.content) : req.body.content
      };

      if (req.file) {
          sopData.pdfPath = req.file.path; // Save the Multer file path
      }

      const newSOP = new SOP(sopData);
      await newSOP.save();
      res.status(201).json(newSOP);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
};


exports.downloadSOPPdf = async (req, res) => {
  try {
      const sop = req.requestedSOP; 

      // NEW LOGIC: Apply the exact same bypass here for downloading
      if (!sop.requiredRoles.includes(req.user.role) && req.user.role !== 'Admin' && req.user.role !== 'Operator') {
          return res.status(403).json({ message: 'You do not have the required role to download this SOP.' });
      }

      if (!sop.pdfPath) {
          return res.status(404).json({ message: 'No PDF associated with this SOP.' });
      }

      const absolutePath = path.resolve(sop.pdfPath);
      res.sendFile(absolutePath);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};