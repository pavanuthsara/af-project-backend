const UserRepository = require('../../domain/repositories/UserRepository');
const UserModel = require('../schemas/UserSchema');
const User = require('../../domain/entities/User');

class MongoUserRepository extends UserRepository {
  async save(user) {
    const mongoUser = await UserModel.create({
      name: user.name,
      email: user.email,
      password: user.passwordHash,
      role: user.role,
    });
    return new User(mongoUser._id.toString(), mongoUser.name, mongoUser.email, mongoUser.password, mongoUser.role);
  }

  async findByEmail(email) {
    const mongoUser = await UserModel.findOne({ email });
    if (!mongoUser) return null;
    return new User(mongoUser._id.toString(), mongoUser.name, mongoUser.email, mongoUser.password, mongoUser.role);
  }
}

module.exports = MongoUserRepository;