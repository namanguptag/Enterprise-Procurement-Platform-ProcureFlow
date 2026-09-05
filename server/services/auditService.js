const db = require('../config/db');

class AuditService {
  /**
   * Log an administrative or state-changing action.
   * previousValue and updatedValue should be objects (which will be JSON stringified).
   */
  async log(userId, action, module, previousValue = null, updatedValue = null) {
    try {
      const prevJSON = previousValue ? JSON.stringify(previousValue) : null;
      const updatedJSON = updatedValue ? JSON.stringify(updatedValue) : null;

      const query = `
        INSERT INTO AuditLogs (user_id, action, module, previous_value, updated_value)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.execute(query, [userId, action, module, prevJSON, updatedJSON]);
    } catch (err) {
      // Avoid breaking core operations if audit logging fails
      console.error(`Audit logging failed for action [${action}] in module [${module}]:`, err.message);
    }
  }
}

module.exports = new AuditService();
