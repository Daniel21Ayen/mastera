#!/usr/bin/env bash
set -e

echo "Pushing main and all 10 branches (316 commits) to GitHub..."
git push -u origin main
git push origin --all
git push origin --tags
echo "All branches and commits pushed successfully!"
