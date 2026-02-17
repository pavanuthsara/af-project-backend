class User {
  constructor(id, name, email, passwordHash, role = 'user') {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
  }
}

module.exports = User;