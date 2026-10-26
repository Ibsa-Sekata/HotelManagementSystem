/**
 * asyncHandler.js — Wrapper for async Express route handlers
 *
 * The problem:
 * Express does not automatically catch errors thrown inside async functions.
 * Without this wrapper, an unhandled promise rejection would crash the server
 * or hang the request forever.
 *
 * The solution:
 * Wrap every async controller function with asyncHandler. If the function
 * throws an error (or rejects a promise), asyncHandler catches it and passes
 * it to Express's next() function, which routes it to our global error handler.
 *
 * Without asyncHandler (bad — error is silently swallowed):
 *   router.get('/rooms', async (req, res) => {
 *     const rooms = await Room.find(); // if this throws, request hangs
 *     res.json(rooms);
 *   });
 *
 * With asyncHandler (good):
 *   router.get('/rooms', asyncHandler(async (req, res) => {
 *     const rooms = await Room.find(); // if this throws, error goes to handler
 *     res.json(rooms);
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
