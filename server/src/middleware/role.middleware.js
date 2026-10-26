/**
 * role.middleware.js — Role-based authorization middleware
 *
 * This middleware must always run AFTER protect (auth.middleware.js),
 * because it relies on req.user being set.
 *
 * It checks whether the logged-in user's role is in the list of allowed roles.
 * If not, it returns 403 Forbidden.
 *
 * Role hierarchy (highest to lowest):
 *   admin > manager > receptionist > customer
 *
 * Usage — restrict a route to managers and admins:
 *   router.post('/rooms', protect, authorize('manager', 'admin'), createRoom);
 *
 * Usage — restrict a route to admins only:
 *   router.patch('/staff/:id/role', protect, authorize('admin'), changeRole);
 *
 * IMPORTANT — this middleware enforces WHAT a user can do.
 * The protect middleware enforces WHETHER a user is logged in.
 * Both are needed on protected routes.
 */

const ApiError = require('../utils/ApiError');

/**
 * Returns a middleware function that allows only the specified roles.
 *
 * @param  {...string} roles — e.g. authorize('manager', 'admin')
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // protect() must run first — if req.user is missing, the setup is wrong
    if (!req.user) {
      return next(ApiError.internal('authorize() used without protect() middleware'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Your role '${req.user.role}' is not authorized for this action. ` +
          `Required: ${roles.join(' or ')}.`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
