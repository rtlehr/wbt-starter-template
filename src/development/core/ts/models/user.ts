// ------------------------------------------
// Model: User
// ------------------------------------------

export interface IUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export class User implements IUser {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public role: string = "guest"
  ) {}

  get displayName(): string {
    return `${this.name} (${this.role})`;
  }

  promote(newRole: string): void {
    console.log(`Promoting ${this.name} to ${newRole}`);
    this.role = newRole;
  }
}
