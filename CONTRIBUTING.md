# Contributing to Redmarc

Thank you for your interest in contributing to Redmarc. Every improvement matters — whether it is a bug report, a design suggestion, or a pull request.

---

## Code of Conduct

Be respectful. We maintain a welcoming environment for contributors of all backgrounds and skill levels. Harassment of any kind will not be tolerated.

---

## How to Contribute

### Reporting Bugs

- Search existing issues first to avoid duplicates.
- Use a clear, descriptive title.
- Include steps to reproduce, expected behavior, and actual behavior.
- Attach screenshots or screen recordings when relevant.
- Mention your Redmine version and browser.

### Suggesting Features

- Open an issue with the `enhancement` label.
- Describe the use case — why would this be useful to other Redmine users?
- If you have a design idea, sketches or mockups are very welcome.

### Pull Requests

- Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
- Keep pull requests focused — one feature or fix per PR.
- Include screenshots in the PR description if you changed the UI.
- Make sure the frontend builds without errors: `npm run build`
- End all files with a newline.

---

## Development Setup

### Backend (Rails plugin)

The backend is minimal. The main files are:

```
app/controllers/redmarc_controller.rb  — single controller, renders the SPA
config/routes.rb                       — registers /redmarc route
init.rb                                — plugin registration
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev      # development server on :5173
npm run build    # production build → ../assets/
```

The built assets are committed to the repository so that users can install the plugin without a Node.js environment.

### Project Structure

```
frontend/
  src/
    components/     # UI components (KanbanBoard, IssueCard, IssueDetailPanel, ...)
    hooks/          # Custom React hooks (useAppData, useDragAndDrop, ...)
    utils/          # API client, status mapping, helpers
    App.jsx         # Root orchestrator
    index.css       # Design tokens and theme definitions
    App.css         # Component-level styles
```

---

## Commit Style

We follow a simple conventional commit format:

```
type: short description in present tense
```

Types: `feat`, `fix`, `refact`, `chore`, `docs`, `style`

Examples:
```
feat: add drag-and-drop between kanban columns
fix: resolve status id mismatch on issue move
refact: extract pagination logic into hook
docs: update installation steps for Redmine 5.1
```

---

Thank you for helping make Redmine better.
