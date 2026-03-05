const fs = require('fs');
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
// Created by SOP Intelligence
exports.createSOP = async (req, res) => {
  try {
      // Safely handle form-data payload
      const sopData = { ...req.body };

      // Parse stringified JSON content (if any)
      if (req.body.content && typeof req.body.content === 'string') {
          sopData.content = JSON.parse(req.body.content);
      }

      // NEW: Parse the stringified references array sent from FormData
      if (req.body.references && typeof req.body.references === 'string') {
          try {
              sopData.references = JSON.parse(req.body.references);
          } catch (e) {
              return res.status(400).json({ error: 'Invalid references format. Must be a JSON array.' });
          }
      }

      if (req.file) {
          sopData.pdfPath = req.file.path; // Save the Multer file path
      }

      const newSOP = new SOP(sopData);
      await newSOP.save();
      res.status(201).json(newSOP);
  } catch (err) {
      // Handle MongoDB duplicate key error for the unique sopId
      if (err.code === 11000) {
          return res.status(400).json({ error: 'SOP ID already exists.' });
      }
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

// Delete a specific SOP
exports.deleteSOP = async (req, res) => {
    try {
        const sop = await SOP.findById(req.params.id);
        
        if (!sop) {
            return res.status(404).json({ message: 'SOP not found.' });
        }
  
        // If there is an associated PDF file, delete it from the uploads folder
        if (sop.pdfPath) {
            const absolutePath = path.resolve(sop.pdfPath);
            fs.unlink(absolutePath, (err) => {
                if (err) console.error(`Failed to delete PDF file at ${absolutePath}:`, err);
            });
        }
  
        // Delete the SOP document from the database
        await SOP.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'SOP deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  };


  // Update a specific SOP
exports.updateSOP = async (req, res) => {
    try {
        const sop = await SOP.findById(req.params.id);
        
        if (!sop) {
            return res.status(404).json({ message: 'SOP not found.' });
        }

        const updateData = { ...req.body };

        // Parse stringified JSON content (if any)
        if (req.body.content && typeof req.body.content === 'string') {
            updateData.content = JSON.parse(req.body.content);
        }

        // Parse the stringified references array
        if (req.body.references && typeof req.body.references === 'string') {
            try {
                updateData.references = JSON.parse(req.body.references);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid references format. Must be a JSON array.' });
            }
        }

        // Handle new PDF upload
        if (req.file) {
            // Delete the old PDF file if it exists
            if (sop.pdfPath) {
                const absolutePath = path.resolve(sop.pdfPath);
                fs.unlink(absolutePath, (err) => {
                    if (err) console.error(`Failed to delete old PDF file at ${absolutePath}:`, err);
                });
            }
            updateData.pdfPath = req.file.path; // Set the new file path
        }

        const updatedSOP = await SOP.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        res.json({ message: 'SOP updated successfully.', sop: updatedSOP });
    } catch (err) {
        // Handle duplicate key error if they try to change sopId to an existing one
        if (err.code === 11000) {
            return res.status(400).json({ error: 'SOP ID already exists.' });
        }
        res.status(400).json({ error: err.message });
    }
};