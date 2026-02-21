#!/usr/bin/env pwsh

# Initialize git repository
git init

# Configure user
git config user.email "dev@tetrio-bot.local"
git config user.name "Tetrio Bot Developer"

# Stage all files
git add .

# Create commit
git commit -m "feat: Initialize Tetris AI bot with game engine and AI system"

# Show commit log
git log --oneline
