#!/bin/bash

# Trader Backend Setup Script
# Pipeline Rivers - Automated setup and initialization

echo "╔════════════════════════════════════════════════════════╗"
echo "║  🌊 Trader Backend Setup - Pipeline Rivers           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi
echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✓ Database seeded successfully"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                   ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  To start the server:                                  ║"
echo "║  • Development: npm run dev                            ║"
echo "║  • Production:  npm start                              ║"
echo "╚════════════════════════════════════════════════════════╝"
