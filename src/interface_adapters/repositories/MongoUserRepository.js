const UserRepository = require('../../domain/repositories/UserRepository');
const UserModel = require('../schemas/UserSchema');
const User = require('../../domain/entities/User');

/**
 * MongoUserRepository
 * Implementation of UserRepository for MongoDB.
 * Handles persistence of User entities.
 */
class MongoUserRepository extends UserRepository {
  /**
   * Save a new user to the database
   * @param {User} user - User entity to save
   * @returns {User} Saved user entity with database ID
   */
  async save(user) {
    const mongoUser = await UserModel.create({
      name: user.name,
      email: user.email,
      password: user.passwordHash,
      role: user.role || 'user' // Include role when saving
    });
    return new User(
      mongoUser._id.toString(), 
      mongoUser.name, 
      mongoUser.email, 
      mongoUser.password,
      mongoUser.role
    );
  }

  /**
   * Find a user by email
   * @param {string} email - User's email address
   * @returns {User|null} User entity or null if not found
   */
  async findByEmail(email) {
    const mongoUser = await UserModel.findOne({ email });
    if (!mongoUser) return null;
    return new User(
      mongoUser._id.toString(), 
      mongoUser.name, 
      mongoUser.email, 
      mongoUser.password,
      mongoUser.role // Include role when retrieving
    );
  }
}

module.exports = MongoUserRepository;