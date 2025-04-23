#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print header
echo "=========================================="
echo "ML-Based Anomaly Detection System Test Tool"
echo "=========================================="
echo ""

# Run the test script with arguments
npx ts-node $DIR/cli/testAnomaly.ts "$@"