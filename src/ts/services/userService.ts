// ------------------------------------------
// Service: UserService
// ------------------------------------------
import { User } from "../models/user";

export class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(`✅ Added user: ${user.displayName}`);
  }

  getAllUsers(): User[] {
    return this.users;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  promoteUser(email: string, role: string): void {
    const user = this.findByEmail(email);
    if (user) {
      user.promote(role);
    } else {
      console.warn(`⚠️ User with email ${email} not found.`);
    }
  }
}
