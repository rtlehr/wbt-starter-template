"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/js/app.js
  var require_app = __commonJS({
    "src/js/app.js"() {
      var User = class {
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
      };
      var UserService = class {
        constructor() {
          this.users = [];
        }
        addUser(user) {
          this.users.push(user);
          console.log(`\u2705 Added user: ${user.displayName}`);
        }
        getAllUsers() {
          return this.users;
        }
        findByEmail(email) {
          return this.users.find((u) => u.email === email);
        }
        promoteUser(email, role) {
          const user = this.findByEmail(email);
          if (user) {
            user.promote(role);
          } else {
            console.warn(`\u26A0\uFE0F User with email ${email} not found.`);
          }
        }
      };
      var AppUI = class {
        constructor(service) {
          this.service = service;
        }
        init() {
          console.log("\u{1F680} App initialized.");
          const alice = new User(1, "Alice Johnson", "alice@example.com", "admin");
          const bob = new User(2, "Bob Smith", "bob@example.com");
          this.service.addUser(alice);
          this.service.addUser(bob);
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
        ${users.map((u) => `<li class="list-group-item">${u.displayName}</li>`).join("")}
      </ul>
      <button id="promote-btn" class="btn btn-primary">Promote Bob</button>
    `;
          $container.html(html);
        }
      };
      $(document).ready(function() {
        const service = new UserService();
        const app = new AppUI(service);
        app.init();
      });
    }
  });
  require_app();
})();
