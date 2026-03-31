const SOP = require("../models/SOP");

// Get all accessible SOPs based on System and Role
exports.getSOPs = async (req, res) => {
  try {
    let filter = {};

    // If STEM is calling, only show Active SOPs that match their role
    if (req.user.system === "STEM") {
      filter.status = "Active";
      filter.requiredRoles = req.user.role;
    }

    const sops = await SOP.find(filter).select("-__v");
    res.json(sops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get specific SOP (Middleware handles conditions and audit logging)
exports.getSOPById = async (req, res) => {
  try {
    const sop = req.requestedSOP;

    // Allow if role is in the array, OR if the user is an Admin/Operator
    if (
      !sop.requiredRoles.includes(req.user.role) &&
      req.user.role !== "Admin" &&
      req.user.role !== "Operator"
    ) {
      return res
        .status(403)
        .json({
          message:
            "You do not have the required role to view this specific SOP.",
        });
    }

    res.json(sop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create SOP
exports.createSOP = async (req, res) => {
  try {
    // The frontend now sends the external PDF link in the body (e.g., req.body.pdfPath)
    const sopData = { ...req.body };

    // Parse stringified JSON content (if any)
    if (req.body.content && typeof req.body.content === "string") {
      sopData.content = JSON.parse(req.body.content);
    }

    // Parse the stringified references array
    if (req.body.references && typeof req.body.references === "string") {
      try {
        sopData.references = JSON.parse(req.body.references);
      } catch (e) {
        return res
          .status(400)
          .json({ error: "Invalid references format. Must be a JSON array." });
      }
    }

    const newSOP = new SOP(sopData);
    await newSOP.save();
    res.status(201).json(newSOP);
  } catch (err) {
    // Handle MongoDB duplicate key error for the unique sopId
    if (err.code === 11000) {
      return res.status(400).json({ error: "SOP ID already exists." });
    }
    res.status(400).json({ error: err.message });
  }
};

// Download/View SOP PDF
exports.downloadSOPPdf = async (req, res) => {
  try {
    const sop = req.requestedSOP;

    // Apply the exact same bypass here for downloading
    if (
      !sop.requiredRoles.includes(req.user.role) &&
      req.user.role !== "Admin" &&
      req.user.role !== "Operator"
    ) {
      return res
        .status(403)
        .json({
          message: "You do not have the required role to view this SOP.",
        });
    }

    if (!sop.pdfPath) {
      return res
        .status(404)
        .json({ message: "No PDF associated with this SOP." });
    }

    // Redirect the user directly to the external storage URL
    res.redirect(sop.pdfPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a specific SOP
exports.deleteSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);

    if (!sop) {
      return res.status(404).json({ message: "SOP not found." });
    }

    // Delete the SOP document from the database
    await SOP.findByIdAndDelete(req.params.id);

    res.json({ message: "SOP deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a specific SOP
exports.updateSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);

    if (!sop) {
      return res.status(404).json({ message: "SOP not found." });
    }

    const updateData = { ...req.body };

    // Parse stringified JSON content (if any)
    if (req.body.content && typeof req.body.content === "string") {
      updateData.content = JSON.parse(req.body.content);
    }

    // Parse the stringified references array
    if (req.body.references && typeof req.body.references === "string") {
      try {
        updateData.references = JSON.parse(req.body.references);
      } catch (e) {
        return res
          .status(400)
          .json({ error: "Invalid references format. Must be a JSON array." });
      }
    }

    const updatedSOP = await SOP.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    res.json({ message: "SOP updated successfully.", sop: updatedSOP });
  } catch (err) {
    // Handle duplicate key error if they try to change sopId to an existing one
    if (err.code === 11000) {
      return res.status(400).json({ error: "SOP ID already exists." });
    }
    res.status(400).json({ error: err.message });
  }
};

// Get all SOPs Metadata (Excludes heavy fields: data & pdfPathBase64)
exports.getAllSOPMetadata = async (req, res) => {
  try {
    let filter = {};

    // Apply the same STEM logic you had before
    if (req.user.system === "STEM") {
      filter.status = "Active";
      filter.requiredRoles = req.user.role;
    }

    // Use .select() to EXCLUDE data and pdfPathBase64 (using the '-' prefix)
    const sops = await SOP.find(filter).select("-data -pdfPathBase64 -__v");
    res.json(sops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get ONLY the 'data' field for a specific SOP
exports.getSOPDataById = async (req, res) => {
  try {
    // Optimized query: Only fetch the 'data' and 'requiredRoles' fields
    const sop = await SOP.findById(req.params.id).select("data requiredRoles");

    if (!sop) {
      return res.status(404).json({ message: "SOP not found." });
    }

    // Standard RBAC check
    if (
      !sop.requiredRoles.includes(req.user.role) &&
      req.user.role !== "Admin" &&
      req.user.role !== "Operator"
    ) {
      return res
        .status(403)
        .json({
          message: "You do not have the required role to view this SOP data.",
        });
    }

    res.json({ data: sop.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get ONLY the 'pdfPathBase64' field for a specific SOP
exports.getSOPPdfBase64ById = async (req, res) => {
  try {
    // Optimized query: Only fetch the 'pdfPathBase64' and 'requiredRoles' fields
    const sop = await SOP.findById(req.params.id).select(
      "pdfPathBase64 requiredRoles"
    );

    if (!sop) {
      return res.status(404).json({ message: "SOP not found." });
    }

    // Standard RBAC check
    if (
      !sop.requiredRoles.includes(req.user.role) &&
      req.user.role !== "Admin" &&
      req.user.role !== "Operator"
    ) {
      return res
        .status(403)
        .json({
          message: "You do not have the required role to view this SOP.",
        });
    }

    res.json({ pdfPathBase64: sop.pdfPathBase64 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSOPMetaDataById = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id).select(
      "-pdfPathBase64 -data"
    );

    if (!sop) {
      return res.status(404).json({ message: "SOP not found." });
    }

    // Standard RBAC check
    if (
      !sop.requiredRoles.includes(req.user.role) &&
      req.user.role !== "Admin" &&
      req.user.role !== "Operator"
    ) {
      return res
        .status(403)
        .json({
          message: "You do not have the required role to view this SOP.",
        });
    }

    res.json({ pdfPathBase64: sop.pdfPathBase64 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a structured summary of all SOPs for RAG synchronization
exports.getSOPSummary = async (req, res) => {
  try {
    // We are ignoring RBAC filters as requested
    const summary = await SOP.aggregate([
      {
        $facet: {
          // Part A: Overall Stats
          stats: [
            {
              $group: {
                _id: null,
                totalSops: { $sum: 1 },
              },
            },
          ],
          // Part B: Counts grouped by Type (Quality, Production, Safety)
          countsByType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
          // Part C: The actual Metadata list (excluding heavy fields)
          metadata: [
            {
              $project: {
                data: 0,
                pdfPathBase64: 0,
                content: 0,
                __v: 0,
              },
            },
          ],
        },
      },
    ]);

    const result = summary[0];

    res.json({
      totalSops: result.stats[0]?.totalSops || 0,
      countsByType: result.countsByType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      sops: result.metadata,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
