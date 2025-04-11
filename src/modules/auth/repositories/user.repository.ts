import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from '../../../config/database.config';

@Injectable()
export class UserRepository {
  constructor(private readonly dbConfig: DatabaseConfig) {}

  /**
   * Finds a user by ID
   * @param userId User ID
   * @returns User information or null if not found
   */
  async findById(userId: string) {
    return this.dbConfig.getPrisma().user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Finds a user by email
   * @param email User email
   * @returns User information or null if not found
   */
  async findByEmail(email: string) {
    return this.dbConfig.getPrisma().user.findUnique({
      where: { email }
    });
  }

  /**
   * Creates a new user
   * @param data User data
   * @returns Created user information
   */
  async create(data: {
    id: string;
    email: string;
    username: string;
  }) {
    try {
      return await this.dbConfig.getPrisma().user.create({
        data: {
          id: data.id,
          email: data.email,
          username: data.username
        }
      });
    } catch (error) {
      // If user with email already exists, return that user
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return this.findByEmail(data.email);
      }
      throw error;
    }
  }

  /**
   * Checks if a user exists by ID or email
   * @param userId User ID
   * @param email User email
   * @returns boolean indicating if user exists
   */
  async exists(userId: string, email: string): Promise<boolean> {
    const [userById, userByEmail] = await Promise.all([
      this.findById(userId),
      this.findByEmail(email)
    ]);
    return !!(userById || userByEmail);
  }
}