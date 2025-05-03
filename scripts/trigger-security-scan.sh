#!/bin/bash

# Trigger a security scan through the API

echo "Triggering security scan..."
curl -X POST "http://localhost:5001/api/security/scan?scanType=all"
echo ""
echo "Check the server logs for scan results"