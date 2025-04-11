import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Gets user information
   * @param userId User ID
   * @returns User information or null if not found
   */
  async getUserInfo(userId: string) {
    return this.userRepository.findById(userId);
  }

  /**
   * Creates a new user if it doesn't exist
   * @param userId User ID
   * @param email User email
   * @returns Created or existing user information
   */
  async createUserIfNotExists(userId: string, email: string) {
    console.log("userId", userId);
    console.log("email", email);
    const userExists = await this.userRepository.exists(userId, email);
    console.log("userExists", userExists);
    if (!userExists) {
      const username = email.split('@')[0]; // Use email prefix as username
      return this.userRepository.create({
        id: userId,
        email,
        username
      });
    }

    // If user exists, return the user by ID or email
    const userById = await this.userRepository.findById(userId);
    if (userById) return userById;
    
    return this.userRepository.findByEmail(email);
  }
}