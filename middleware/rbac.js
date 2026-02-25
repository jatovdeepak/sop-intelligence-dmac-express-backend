exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      // Audit logging for failed access could be triggered here
      return res
        .status(403)
        .json({
          message: `Access Denied: Role '${req.user.role}' lacks permissions.`,
        });
    }
    next();
  };
};
