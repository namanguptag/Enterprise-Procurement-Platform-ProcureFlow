const authService = require('../services/authService');

class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await authService.login(username, password);

      // Log successful login activity in background
      await authService.logLoginActivity(result.user.id, username, true, ipAddress);

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result
      });
    } catch (err) {
      // Log failed login activity if user id could be resolved (or null)
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await authService.logLoginActivity(null, req.body.username, false, ipAddress);
      
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // In stateless JWT, client handles clearing token.
      // Server returns standard success response.
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   * Fetches profile of the currently logged-in user (attached by protect middleware)
   */
  async getMe(req, res, next) {
    try {
      // req.user is populated by protect middleware
      return res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
