# JS App Starter

TypeScript + Sass + Grunt + esbuild

## Scripts
- `npm run dev` � dev server (http://127.0.0.1:8081/src/index.html)
- `npm run prod` � production build to /dist
- `npm run preview`  build + serve /dist on http://127.0.0.1:8082/

# JS App Starter

A modern, lightweight **JavaScript + TypeScript starter framework** for building front-end web applications.  
This starter kit is designed for developers who want a clean, modular structure for scalable apps — using **ES modules**, **TypeScript**, and a clear separation between **models**, **services**, and **UI logic**.

---

## 🚀 Features

- ⚙️ Organized project structure (`src/ts/` for code, `dist/` for builds)
- 🧩 Modular TypeScript architecture (Models, Services, UI)
- 🪶 No framework lock-in — works with plain JS, Bootstrap, or custom frameworks
- 📦 Ready for build tools (Grunt, Webpack, Rollup, etc.)
- 🧠 Easy to extend for Angular, React, or Vanilla JS projects
- 🧹 Includes `tsconfig.json` for quick TypeScript compilation setup

---

## 📁 Project Structure

```
js-app-starter/
│
├── src/
│   ├── ts/
│   │   ├── models/
│   │   │   └── user.ts          # Defines the User model
│   │   ├── services/
│   │   │   └── userService.ts   # Example data/service layer
│   │   └── ui/
│   │       └── appUI.ts         # Handles app UI rendering logic
│   │
│   └── index.html               # Example entry point (if included)
│
├── tsconfig.json                # TypeScript configuration
├── package.json                 # NPM dependencies & scripts
├── README.md                    # Project documentation
└── (Optional) Gruntfile.js or build config files
```

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/rtlehr/js-app-starter.git
cd js-app-starter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Compile TypeScript
```bash
npx tsc
```

### 4. Run your app
```bash
npx lite-server
```

---

## 🧠 How It Works

The project follows a **simple layered pattern**:

| Layer | Purpose |
|-------|----------|
| **Models** | Define data types (e.g. `User`, `Product`, `Settings`) |
| **Services** | Manage logic and data retrieval (e.g. from APIs or local storage) |
| **UI** | Handle user interface updates and interactions |

Example:
```typescript
// models/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

// services/userService.ts
import { User } from "../models/user";

export class UserService {
  getUsers(): User[] {
    return [
      { id: 1, name: "Ross Lehr", email: "ross@example.com" },
      { id: 2, name: "Kim Smith", email: "kim@example.com" }
    ];
  }
}

// ui/appUI.ts
import { UserService } from "../services/userService";

const userService = new UserService();
const users = userService.getUsers();

users.forEach(user => {
  console.log(`User: ${user.name} (${user.email})`);
});
```

---

## 🧰 Recommended Tools

| Tool | Purpose |
|------|----------|
| **TypeScript** | Compile `.ts` to `.js` |
| **Grunt / Gulp / Rollup** | Build automation |
| **SASS / Bootstrap** | UI styling |
| **VS Code** | IDE with TypeScript IntelliSense |
| **GitHub Actions (optional)** | CI/CD automation |

---

## 🧪 Extending This Starter

You can easily extend this repo for:

- 🔹 **Angular** — move TypeScript files into `/src/app` and use Angular CLI build.
- 🔹 **React** — integrate with Vite or Create React App.
- 🔹 **Vanilla JS + Bootstrap** — simply include compiled JS in a `<script>` tag.
- 🔹 **Electron** — use as a base for desktop apps.

---

## 🧑‍💻 Author

**Ross Lehr**  
Freelance Developer / Designer  
[GitHub Profile](https://github.com/rtlehr)

---

## 🪪 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.


