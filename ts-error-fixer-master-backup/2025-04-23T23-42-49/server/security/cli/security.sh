#!/bin/bash

# Security CLI Helper Script
# This script makes it easier to run the Security CLI tool

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if required packages are installed
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed"
  exit 1
fi

# Check if the required packages are installed
PACKAGES=("chalk" "inquirer" "commander" "ora" "boxen" "axios" "dotenv")
INSTALL_NEEDED=false

for PACKAGE in "${PACKAGES[@]}"; do
  if ! npm list "$PACKAGE" &> /dev/null; then
    INSTALL_NEEDED=true
    break
  fi
done

# Install required packages if needed
if [ "$INSTALL_NEEDED" = true ]; then
  echo "Installing required packages..."
  npm install chalk inquirer commander ora boxen axios dotenv
fi

# Print header
echo -e "\033[1;32m"
echo "  ____                      _ _           _____  _     ___ "
echo " / ___|  ___  ___ _   _ _ __(_) |_ _   _  / __\ | |   |_ _|"
echo " \___ \ / _ \/ __| | | | '__| | __| | | | \__  \| |    | | "
echo "  ___) |  __/ (__| |_| | |  | | |_| |_| |  __) | |___ | | "
echo " |____/ \___|\___|\__,_|_|  |_|\__|\__, | |____/|_____|___|"
echo "                                   |___/                    "
echo -e "\033[0m"
echo "Security Command Line Interface"
echo "--------------------------------"
echo ""

# Run the CLI with the provided arguments
npx ts-node "$DIR/tools/securityCLI.ts" "$@"