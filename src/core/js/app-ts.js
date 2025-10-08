"use strict";
var App = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/development/core/ts/services/userService.ts
  var UserService;
  var init_userService = __esm({
    "src/development/core/ts/services/userService.ts"() {
      "use strict";
      UserService = class {
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
    }
  });

  // src/development/core/ts/models/user.ts
  var User;
  var init_user = __esm({
    "src/development/core/ts/models/user.ts"() {
      "use strict";
      User = class {
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
    }
  });

  // src/development/core/ts/ui/appUI.ts
  var AppUI;
  var init_appUI = __esm({
    "src/development/core/ts/ui/appUI.ts"() {
      "use strict";
      init_user();
      AppUI = class {
        constructor(service) {
          this.service = service;
        }
        init() {
          console.log("\u{1F680} App initialized.");
          const alice = new User(1, "Alice Johnson", "alice@example.com", "admin");
          const bob = new User(2, "Bob Smith", "bob@example.com");
          this.service.addUser(alice);
          this.service.addUser(bob);
          this.service.promoteUser("bob@example.com", "editor");
          this.renderUserList();
        }
        renderUserList() {
          const users = this.service.getAllUsers();
          const container = document.getElementById("app");
          if (!container) return;
          container.innerHTML = `
      <h2>User List</h2>
      <ul>
        ${users.map((u) => `<li>${u.displayName}</li>`).join("")}
      </ul>
    `;
        }
      };
    }
  });

  // src/development/core/ts/main.ts
  var require_main = __commonJS({
    "src/development/core/ts/main.ts"() {
      init_userService();
      init_appUI();
      document.addEventListener("DOMContentLoaded", () => {
        const service = new UserService();
        const app = new AppUI(service);
        app.init();
      });
      $(() => {
        console.log("\u2705 TypeScript is running and jQuery types are working.");
        $("h1").append(' <span class="badge bg-success" style="font-size:0.6em;">TS OK</span>');
        $("#btnTest").on("click", () => {
          $("#dialog").dialog({ modal: true, width: 400 });
        });
      });
    }
  });
  return require_main();
})();
