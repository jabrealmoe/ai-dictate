# Project Rules & Context

This document serves as a source of truth for AI agents and developers working on the **Dr. Jira Dictate** project.

## 🚀 Deployment Strategy

- **CI/CD Only**: All deployments MUST be triggered via GitHub Actions.
- **Workflow**:
  1.  Commit changes locally.
  2.  Push to `development` branch (`git push origin development`).
  3.  The pipeline automatically:
      - Deploys to **Development**.
      - Promotes to **Staging**.
      - Promotes to **Production**.
- **PROHIBITED**: Do NOT use `forge deploy` locally unless explicitly instructed for specific debugging scenarios.

## 🔐 Backend & Permissions

- **Jira API**: Always use `api.asApp()` instead of `api.asUser()` for resolving Jira API calls (e.g., creating issues). This ensures stability and proper permission scoping independent of the user's immediate context.
- **N8n Integration**:
  - The app communicates with N8n webhooks.
  - Expect responses to be JSON.
  - Implement robust error handling for non-JSON responses.
  - Use `console.log` to print raw N8n responses in the tunnel for debugging.

## 📦 Dependencies & Compatibility

- **React**: The project uses React 18.
- **React Three Fiber (R3F)**:
  - `@react-three/drei`: Must be pinned to `^9.122.0` (or compatible v9 version) to avoid React 19 peer dependency conflicts.
  - `@react-three/fiber`: Must be pinned to `^8.17.10` to avoid React 19 peer dependency conflicts.
- **Forge Packages**: Keep `@forge/api` and `@forge/resolver` updated to the latest stable versions to ensure `asApp()` and other API methods are available.

## 🛠 Development Workflow

- **Tunneling**: Use `forge tunnel` to debug backend resolvers locally. Note that frontend changes usually require a deployment to be visible, but backend logs appear in the tunnel immediately.
- **Linting**: Run `forge lint` before major commits to catch manifest or permission issues.

## 📝 Conventional Commits

All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                       |
| ---------- | ------------------------------------------------- |
| `feat`     | A new feature                                     |
| `fix`      | A bug fix                                         |
| `docs`     | Documentation changes                             |
| `style`    | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature or fix)              |
| `perf`     | Performance improvements                          |
| `test`     | Adding or updating tests                          |
| `build`    | Build system or external dependencies             |
| `ci`       | CI/CD configuration changes                       |
| `chore`    | Maintenance tasks, tooling, etc.                  |
| `revert`   | Reverting a previous commit                       |

### Examples

```
feat: add intro screen with music to PacMan game
fix: resolve wall clipping in grid-based movement
docs: update PROJECT_RULES with conventional commits
chore: update dependencies to latest versions
refactor(game): separate discrete logic from rendering
```

### Rules

1. Use **lowercase** for the type and description
2. Do NOT end the description with a period
3. Keep the first line under 72 characters
4. Use the imperative mood ("add feature" not "added feature")
5. Reference issue numbers in the footer when applicable: `Closes #123`
