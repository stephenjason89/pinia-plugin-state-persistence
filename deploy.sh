#!/usr/bin/env sh

# abort on errors
set -e

# build the project
npm run docs:build

# navigate into the build output directory
cd docs/.vitepress/dist

# clean up any existing Git repo in dist
rm -rf .git

# initialize a new Git repository in the dist directory
git init
git checkout -b main
git add -A
git commit -m 'deploy'

# force push to the gh-pages branch of your repository
git push -f git@github.com:stephenjason89/pinia-plugin-state-persistence.git main:gh-pages

# return to the project root
cd -
