#!/bin/bash
# Install system dependencies for PDF processing
echo "Installing system dependencies..."

# Try to install poppler-utils if running as root
if [ "$EUID" -eq 0 ]; then
    apt-get update -qq
    apt-get install -y poppler-utils libgl1-mesa-glx
    echo "System dependencies installed successfully"
else
    echo "Warning: Not running as root, system dependencies may not be available"
    echo "PDF processing may fall back to image-only mode"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installation complete!"