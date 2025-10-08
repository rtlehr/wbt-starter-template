// ------------------------------------------
// UI Controller
// ------------------------------------------
import { User } from "../models/user";
import { UserService } from "../services/userService";

export class AppUI {
  private service: UserService;

  constructor(service: UserService) {
    this.service = service;
  }

  init(): void {
    console.log("🚀 App initialized.");

    // Example: create some users
    const alice = new User(1, "Alice Johnson", "alice@example.com", "admin");
    const bob = new User(2, "Bob Smith", "bob@example.com");

    this.service.addUser(alice);
    this.service.addUser(bob);

    // Example: promote Bob
    this.service.promoteUser("bob@example.com", "editor");

    // Display results in the DOM
    this.renderUserList();
  }

  renderUserList(): void {
    const users = this.service.getAllUsers();
    const container = document.getElementById("app");
    if (!container) return;

    container.innerHTML = `
      <h2>User List</h2>
      <ul>
        ${users.map(u => `<li>${u.displayName}</li>`).join("")}
      </ul>
    `;
  }
}
