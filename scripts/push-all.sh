#!/usr/bin/env bash
set -e

echo "Pushing all 10 branches and master (315 commits) to GitHub..."
git push origin --all
git push origin --tags
echo "All branches and commits pushed successfully!"
