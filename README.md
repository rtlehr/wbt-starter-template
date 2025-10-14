# wbt-starter-template

TypeScript + Sass + Grunt + esbuild

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/rtlehr/wbt-starter-template.git
cd wbt-starter-template
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

## Scripts
- `npm run dev` � dev server (http://127.0.0.1:8081/src/index.html)
- `npm run prod` � production build to /dist
- `npm run preview`  build + serve /dist on http://127.0.0.1:8082/

# Reset files to the last checkin

```
git reset --hard HEAD
git clean -fd   # optional: removes untracked files/folders
```

# Duplicate this repository

```
# 1) Make a bare mirror of the source repo (includes all refs/tags/branches)
git clone --mirror https://github.com/rtlehr/js-app-starter.git
cd js-app-starter.git

# 2) Push everything to the new empty repo
git remote set-url --push origin https://github.com/rtlehr/NEW-REPOSITORY-NAME.git
git push --mirror
```

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

@'
# 🚀 JavaScript App Starter – Future Development Prompt Template

This template helps you request new functionality in ChatGPT so it fully understands your project’s architecture, dependencies, and build system.

---

## 🧠 Project Context

You are building from a **TypeScript + Sass + Grunt** environment that includes:

- TypeScript (OOP structure with models, services, and UI controllers)
- Sass modular styles (`_variables.scss`, `_mixins.scss`, `_components.scss`, `_breakpoints.scss`)
- Bootstrap + jQuery + jQuery UI
- Esbuild for TypeScript bundling
- Responsive media mixins for desktop, tablet, and phone

---

## 🧩 Prompt Template

Copy and paste this into ChatGPT whenever you want to add or modify functionality.

**Project Context:**  
I’m building from my *JavaScript App Starter* environment — a Grunt-based web app using:
- TypeScript (OOP style)
- SASS with modular structure
- Bootstrap + jQuery + jQuery UI
- Esbuild bundling
- Responsive media mixins for desktop/tablet/phone

**Goal:**  
Describe the new functionality or component you want to add (e.g., a “Task Manager,” “Gallery Grid,” “Modal Form,” etc.)

**Requirements / Preferences:**  
- Where should the logic live? (`src/ts/ui`, `src/ts/services`, etc.)
- What kind of UI interaction? (buttons, modals, animations, forms)
- Any new SCSS partials or updates?
- Any data sources? (JSON file, API, localStorage)
- Should it run in **dev** only or also in **prod**?

**Deliverables I’d like:**  
1. TypeScript code with comments  
2. SCSS additions or modifications  
3. HTML changes (if needed)  
4. Any Grunt or NPM updates  
5. Testing instructions

**Example:**  
“Create a new `TaskManager` class under `src/ts/services/` and a `TaskUI` controller under `src/ts/ui/` to manage tasks (add/edit/delete). Style the list using responsive Sass cards.”


## 🪪 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.


