// Disable source maps and reduce memory usage
process.env.GENERATE_SOURCEMAP = 'false';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';
process.env.IMAGE_INLINE_SIZE_LIMIT = '0';

// Reduce memory usage
process.env.NODE_OPTIONS = '--max-old-space-size=1536';

// Run standard react-scripts build
require('react-scripts/scripts/build');
