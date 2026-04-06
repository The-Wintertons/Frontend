#!/bin/bash

# Frontend Test Suite Runner with Vitest
# Installs dependencies if needed and runs all tests

set -e

cd "$(dirname "$0")" || exit 1

echo "Frontend Test Suite"
echo "===================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Generating test reports..."
node generate-reports.js

echo ""
echo "Test suite completed!"
echo ""
echo "Results location: test-results/"
echo "   - test-report.md"
echo "   - test-report.csv"
echo "   - test-report.json"
echo "   - test-report.xlsx"
echo "   - test-summary.txt"
