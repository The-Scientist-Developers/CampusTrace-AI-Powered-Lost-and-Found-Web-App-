# PowerShell script to remove already tracked files that should be ignored
Write-Host "Cleaning up Git repository..." -ForegroundColor Cyan

# Remove node_modules
git rm -r --cached CampusTrace-FrontEnd/node_modules/ 2>$null
git rm -r --cached CampusTrace-Backend/node_modules/ 2>$null

# Remove Python cache
git rm -r --cached **/__pycache__/ 2>$null

# Remove build folders
git rm -r --cached CampusTrace-FrontEnd/build/ 2>$null
git rm -r --cached CampusTrace-FrontEnd/dist/ 2>$null
git rm -r --cached CampusTrace-Backend/dist/ 2>$null
git rm -r --cached CampusTrace-FrontEnd/.vite/ 2>$null

# Remove IDE files
git rm -r --cached .vscode/ 2>$null
git rm -r --cached .idea/ 2>$null

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host "Now run: git add .gitignore" -ForegroundColor Yellow
Write-Host "Then: git commit -m 'chore: update gitignore'" -ForegroundColor Yellow
