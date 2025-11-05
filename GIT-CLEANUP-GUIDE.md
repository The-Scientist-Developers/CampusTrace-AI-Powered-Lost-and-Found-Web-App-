# Git Cleanup Guide

## 🚨 Problem

Too many unnecessary files got committed to Git (node_modules, cache files, logs, etc.)

## ✅ Solution

### Step 1: Run the cleanup script

```powershell
.\cleanup-git.ps1
```

This will remove all unnecessary files from Git tracking (but keep them on your computer).

### Step 2: Commit the changes

```bash
git add .gitignore
git commit -m "chore: update .gitignore and remove tracked files"
git push
```

## 📋 What Gets Ignored Now

### Python

- `__pycache__/` folders
- `*.pyc`, `*.pyo`, `*.pyd` files
- `venv/`, `.venv/` virtual environments
- Build/dist folders

### Node.js

- `node_modules/` folders (HUGE!)
- Build outputs (`build/`, `dist/`, `.vite/`)
- Log files
- Cache folders

### Environment Files (IMPORTANT!)

- `.env` files (contain secrets!)
- `.env.local`, `.env.production`, etc.

### IDE Files

- `.vscode/` settings
- `.idea/` (JetBrains IDEs)
- `*.swp`, `*.swo` (vim)
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)

## 🔍 Check What's Tracked

To see all tracked files:

```bash
git ls-files
```

To check file sizes in your repo:

```bash
git ls-files -z | xargs -0 du -h | sort -h | tail -20
```

## 🆘 Emergency: Already Pushed?

If you already pushed large files and want to remove them from history:

⚠️ **WARNING**: This rewrites history! Coordinate with your team first.

```bash
# Install BFG Repo-Cleaner (one-time)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove node_modules from entire history
java -jar bfg.jar --delete-folders node_modules

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (coordinate with team!)
git push --force
```

## 📊 Check Repository Size

```bash
git count-objects -vH
```

## ✨ Best Practices

1. **Always check** `.gitignore` before first commit
2. **Never commit**:
   - Dependencies (node_modules, venv)
   - Environment files (.env)
   - Build outputs
   - Log files
   - IDE settings
3. **Do commit**:
   - Source code
   - Package manifests (package.json, requirements.txt)
   - Example environment files (.env.example)
   - Documentation

## 🎯 Quick Commands

```bash
# See what's about to be committed
git status

# See what's ignored
git status --ignored

# Check if file is tracked
git ls-files | grep "filename"

# Stop tracking a file (keep locally)
git rm --cached path/to/file

# Stop tracking a folder (keep locally)
git rm -r --cached path/to/folder/
```
