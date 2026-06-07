const mongoose = require('mongoose');

/**
 * Generic ownership enforcement middleware generator.
 * Options:
 * - model: Mongoose model to query (required)
 * - idParam: request param name for the resource id (default: 'id')
 * - ownerField: field on the document storing owner reference (default: 'owner')
 * - allowRoles: array of roles that bypass ownership checks (default: admin/office/superadmin)
 */
function enforceOwnership({ model, idParam = 'id', ownerField = 'owner', allowRoles = ['admin', 'office', 'superadmin'] }) {
  if (!model) throw new Error('model is required for enforceOwnership');

  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });

      // Roles that are allowed to bypass ownership checks
      if (allowRoles.includes(req.user.role)) return next();

      const id = req.params[idParam];
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid resource id' });
      }

      const doc = await model.findById(id).select(ownerField + '');
      if (!doc) return res.status(404).json({ message: 'Resource not found' });

      const owner = doc[ownerField];
      if (!owner) {
        // If resource has no owner defined, deny access to non-privileged users
        return res.status(403).json({ message: 'Access denied' });
      }

      if (owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // ownership verified
      next();
    } catch (err) {
      console.error('Ownership middleware error:', err.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

module.exports = { enforceOwnership };
