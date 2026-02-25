const SOP = require('../models/SOP');

exports.checkSOPState = async (req, res, next) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: 'SOP not found' });

    // STEM can only access Active SOPs. Intelligence can access Drafts.
    if (req.user.system === 'STEM' && sop.status !== 'Active') {
      return res
        .status(403)
        .json({
          message: `Access Denied: SOP state is '${sop.status}'. STEM requires 'Active'.`,
        });
    }

    // Attach SOP to request to save a DB call in the controller
    req.requestedSOP = sop;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server Error during state validation' });
  }
};
