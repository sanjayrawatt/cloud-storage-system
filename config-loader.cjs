// Use CommonJS 'require' syntax
const fs = require('fs');
const path = require('path');

console.log('--- Running Custom Environment Loader (CommonJS Version) ---');

try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFileContent = fs.readFileSync(envPath, 'utf8');

  // Go through each line in the .env file
  envFileContent.split('\n').forEach(line => {
    // Ignore comments and empty lines
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts.shift();
      const value = parts.join('=');
      
      if (key && value) {
        // Assign the variable to the Node.js process
        process.env[key.trim()] = value.trim();
      }
    }
  });

  console.log('--- Custom Loader Finished Successfully ---');

} catch (error) {
  console.error('!!! CRITICAL ERROR IN CUSTOM LOADER !!!');
  console.error('Could not find or read the .env file.', error);
  process.exit(1); // Stop the application if config can't be loaded
}
