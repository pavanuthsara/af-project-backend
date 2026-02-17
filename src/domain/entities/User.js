/**
 * User Entity
 * Domain entity representing a user in the system.
 * Includes role for authorization purposes.
 */
class User {
  constructor(id, name, email, passwordHash, role = 'user') {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role; // 'user' or 'admin' - used for authorization
  }
}

module.exports = User;