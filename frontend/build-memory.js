const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting memory-optimized build...');

// Set environment variables for minimal build
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=2048';
process.env.BUILD_PATH = './build';

try {
  // Clean build directory first
  const buildPath = path.join(__dirname, 'build');
  if (fs.existsSync(buildPath)) {
    fs.rmSync(buildPath, { recursive: true, force: true });
    console.log('Cleaned previous build directory');
  }

  // Simple build command
  console.log('Running build with memory optimization...');
  execSync('node --max-old-space-size=2048 ./node_modules/react-scripts/scripts/build.js', {
    stdio: 'inherit',
    env: { ...process.env },
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
