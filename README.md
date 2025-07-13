# gh-push-env 🧪🔐

Push `.env` secrets and variables directly to your GitHub repository using the GitHub API and Octokit.  
No more manual input or GitHub CLI dependency — automate your GitHub Actions environment setup in one shot.

---

## 🚀 Features

- 🔒 Push secrets (`gh-push-env` encrypts using your repo’s public key)
- 🌐 Push variables (plain values for GitHub Actions)
- 📦 Loads from `.env` file (via `dotenv`)
- 🧠 Built with [Octokit](https://github.com/octokit/rest.js)
- ⚡ Powered by [Bun](https://bun.sh/)
- 🛠️ CLI-ready (works with `npx`, `bunx`, or global install)
- 🧪 Supports dry-run mode (coming soon)

---

## 📦 Installation

```bash
# Run without installing
npx gh-push-env

# Or install globally
npm install -g gh-push-env
gh-push-env

```
