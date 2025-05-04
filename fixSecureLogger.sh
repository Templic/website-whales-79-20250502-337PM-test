#!/bin/bash

# Get the file path
file="server/security/advanced/apiValidation/ValidationEngine.ts"

# Create temporary files
tmp_file="/tmp/tmp_file_$$"

# Copy the original file
cp "$file" "$tmp_file"

# Replace the simple cases (just changing the function name)
cat "$tmp_file" | 
  sed 's/secureLog(/secureLogger(/g' |
  # Fix the metadata pattern (add "metadata: " wrapper)
  sed 's/secureLogger([^,]*,[^,]*,[^,]*,[ ]*{[ ]*\([^}]*\)[ ]*})/secureLogger(\1, { metadata: { \2 } })/g' > "$file"

echo "Replacements completed for $file"
