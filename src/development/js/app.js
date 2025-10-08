// ------------------------------------------
// Simple JavaScript OOP Example
// Compatible with your current setup
// ------------------------------------------

// === User Class ===
class User {
  constructor(id, name, email, role = "guest") {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }

  get displayName() {
    return `${this.name} (${this.role})`;
  }

  promote(newRole) {
    console.log(`Promoting ${this.name} to ${newRole}`);
    this.role = newRole;
  }
}

// === User Service ===
class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
    console.log(`✅ Added user: ${user.displayName}`);
  }

  getAllUsers() {
    return this.users;
  }

  findByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  promoteUser(email, role) {
    const user = this.findByEmail(email);
    if (user) {
      user.promote(role);
    } else {
      console.warn(`⚠️ User with email ${email} not found.`);
    }
  }
}

// === UI Controller ===
class AppUI {
  constructor(service) {
    this.service = service;
  }

  init() {
    console.log("🚀 App initialized.");

    const alice = new User(1, "Alice Johnson II", "alice@example.com", "admin");
    const bob = new User(2, "Ralph Cannonball III", "bob@example.com");

    this.service.addUser(alice);
    this.service.addUser(bob);

    // Example jQuery interaction
    $("#promote-btn").on("click", () => {
      this.service.promoteUser("bob@example.com", "editor");
      this.renderUserList();
    });

    this.renderUserList();
  }

  renderUserList() {
    const users = this.service.getAllUsers();
    const $container = $("#js-app");

    if (!$container.length) return;

    let html = `
      <h2>User List</h2>
      <ul class="list-group mb-3">
        ${users.map(u => `<li class="list-group-item">${u.displayName}</li>`).join("")}
      </ul>
      <button id="promote-btn" class="btn btn-primary">Promote Bob</button>
    `;

    $container.html(html);
  }
}

// === App Bootstrap ===
$(document).ready(function() {
  const service = new UserService();
  const app = new AppUI(service);
  app.init();
});
