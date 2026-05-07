#!/bin/bash
# VirtuLab – Full Stack Server (Linux/macOS)

echo ""
echo "  ========================================"
echo "   VirtuLab – Starting Full Stack Server"
echo "  ========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "  [ERROR] Python3 not found. Install it first."
    exit 1
fi

# Install dependencies
echo "  [1/2] Installing dependencies..."
pip3 install -r requirements.txt --quiet 2>/dev/null

# Start server
echo "  [2/2] Starting server..."
echo ""
python3 backend/app.py
