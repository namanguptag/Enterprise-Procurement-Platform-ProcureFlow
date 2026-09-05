const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

class AuthService {
  /**
   * Authenticate a user by username and password.
   * Returns user details and JWT token.
   */
  async login(username, password) {
    // 1. Fetch user and their role
    const query = `
      SELECT u.id, u.role_id, r.name as role_name, u.username, u.email, u.password_hash, u.first_name, u.last_name, u.status
      FROM Users u
      JOIN Roles r ON u.role_id = r.id
      WHERE u.username = ?
    `;
    const [rows] = await db.execute(query, [username]);
    const user = rows[0];

    // 2. Verify user existence
    if (!user) {
      throw new AppError('Invalid username or password.', 401);
    }

    // 3. Verify user status
    if (user.status !== 'active') {
      throw new AppError('Your account has been deactivated. Please contact your administrator.', 403);
    }

    // 4. Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      throw new AppError('Invalid username or password.', 401);
    }

    // 5. Generate JWT token
    const token = this.generateToken({
      id: user.id,
      username: user.username,
      role: user.role_name
    });

    // 6. Return sanitized user object and token
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name
      }
    };
  }

  /**
   * Generate a standard JWT token containing the payload.
   */
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  /**
   * Log an authentication activity in the audit logs database.
   */
  async logLoginActivity(userId, username, isSuccess, ipAddress) {
    try {
      const action = isSuccess ? 'USER_LOGIN' : 'USER_LOGIN_FAILED';
      const metadata = JSON.stringify({ username, ip: ipAddress });
      const query = `
        INSERT INTO AuditLogs (user_id, action, module, previous_value, updated_value)
        VALUES (?, ?, 'Authentication', NULL, ?)
      `;
      await db.execute(query, [userId || null, action, metadata]);
    } catch (err) {
      // Don't crash login flow if audit logging fails, just log locally
      console.error('Audit logger error for login:', err.message);
    }
  }
}

module.exports = new AuthService();
