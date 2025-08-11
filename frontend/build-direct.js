const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Custom build script starting...');

try {
  // Ensure permissions
  const reactScriptsPath = path.join(__dirname, 'node_modules', '.bin', 'react-scripts');
  
  if (fs.existsSync(reactScriptsPath)) {
    console.log('📁 Setting permissions...');
    try {
      fs.chmodSync(reactScriptsPath, 0o755);
      console.log('✅ Permissions set');
    } catch (permError) {
      console.log('⚠️ Permission setting failed, continuing...');
    }
  }
  
  // Try multiple build approaches
  const buildCommands = [
    'node --max-old-space-size=4096 node_modules/.bin/react-scripts build',
    'node --max-old-space-size=2048 node_modules/react-scripts/scripts/build.js',
    'GENERATE_SOURCEMAP=false node --max-old-space-size=4096 node_modules/.bin/react-scripts build'
  ];
  
  for (let i = 0; i < buildCommands.length; i++) {
    const cmd = buildCommands[i];
    console.log(`🏗️ Trying build method ${i + 1}: ${cmd}`);
    
    try {
      execSync(cmd, { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: { ...process.env, CI: 'false', GENERATE_SOURCEMAP: 'false' }
      });
      console.log('🎉 Build successful!');
      process.exit(0);
    } catch (error) {
      console.log(`❌ Method ${i + 1} failed: ${error.message}`);
      if (i === buildCommands.length - 1) {
        throw error;
      }
    }
  }
  
} catch (error) {
  console.error('💥 All build methods failed:', error.message);
  process.exit(1);
}
