/**
 * validate.middleware.js — Runs express-validator and returns errors
 *
 * How express-validator works:
 *   1. You declare rules in a validators/ file (e.g. auth.validators.js)
 *   2. Those rules are added as middleware BEFORE the controller
 *   3. express-validator runs each rule and collects errors
 *   4. THIS middleware checks if there are any errors and responds 400 if so
 *
 * Usage in a route file:
 *   router.post('/register',
 *     registerRules,         // array of validation rules
 *     validate,              // this middleware — stops if rules failed
 *     authController.register // only runs if all rules passed
 *   );
 *
 * Response shape on validation failure:
 *   {
 *     "success": false,
 *     "message": "Validation failed",
 *     "errors": [
 *       { "field": "email", "message": "Please provide a valid email address" },
 *       { "field": "password", "message": "Password must be at least 8 characters" }
 *     ]
 *   }
 */

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next(); // all good — pass control to the controller
  }

  // Format errors consistently: [{ field, message }]
  const formatted = errors.array().map((err) => ({
    field:   err.path || err.param || 'unknown',
    message: err.msg,
  }));

  return next(ApiError.badRequest('Validation failed', formatted));
};

module.exports = validate;
