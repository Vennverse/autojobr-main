#!/bin/bash

echo "📤 Pushing AutoJobr updates to GitHub"

# Add all changes
git add .

# Commit with timestamp
git commit -m "Fix signup functionality and database schema issues - $(date)"

# Push to main branch
git push origin main

echo "✅ Updates pushed to GitHub"
echo ""
echo "Now run this on your VM:"
echo "cd ~/autojobr-main && ./deploy-from-github.sh"