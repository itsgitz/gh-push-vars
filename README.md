# gh-push-env 🔐🐙

Automatically push `.env` secrets and variables to your GitHub repository using the GitHub REST API + Octokit.  
No more manual `gh secret set` or navigating UI. Just run it once, and you're done.

---

## 🚀 Features

- 🔒 Automatically detects and pushes secrets and variables
- 📦 Loads from `.env`
- ⚡ No GitHub CLI required
- 🧠 Built with [Octokit](https://github.com/octokit/rest.js)
- 🧪 Built for [Bun](https://bun.sh/) but works with Node too
- 🛠️ CLI-friendly — use with `npx`, `bunx`, or global install

---

## 📦 Install

```bash
# Without installing globally
npx gh-push-env

# Or with Bun
bunx gh-push-env

# Or install globally
npm install -g gh-push-env

```

---

## 🔧 Usage

```bash
gh-push-env
```

> The tool reads environment variables from a .env file and auto-detects which to push to GitHub as secrets or variables.

---

## 🧪 .env Setup

```bash
# Required GitHub config
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=your-org-or-username
GITHUB_REPO=target-repo

# Secrets (auto-detected)
GH_SECRET_DB_PASSWORD=supersecret
GH_SECRET_API_KEY=abcd1234

# Variables (auto-detected)
GH_VAR_ENVIRONMENT=production
GH_VAR_REGION=us-east-1

```

> Only environment variables prefixed with GH*SECRET* and GH*VAR* will be processed.

---

## 💡 How It Works

| Prefix       | Action                                       |
| ------------ | -------------------------------------------- |
| `GH_SECRET_` | Encrypted and uploaded as **GitHub Secret**  |
| `GH_VAR_`    | Uploaded as **GitHub Variable** (plain text) |

## 🛡 Token Permissions

Your `GITHUB_TOKEN` must have the following scopes:

- `repo`
- `admin:repo_hook`
- `actions`

## 📌 Roadmap

- [x] Auto-detect secrets and variables via prefix
- [ ] --dry-run support
- [ ] Multi-env support (`.env.dev`, `.env.prod`)
- [ ] Apply to multiple repos/orgs
- [ ] YAML or JSON config alternative

## 📄 License

MIT © 2025 Anggit M Ginanjar
