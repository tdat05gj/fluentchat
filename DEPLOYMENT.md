# 🚀 Render Deployment Instructions

## Quick Setup

### 1. Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select repository: `tdat05gj/fluentchat`
5. Branch: `main`

### 2. Configure Service Settings

**Basic Configuration:**
- **Name:** `fluent-messenger` (or your preferred name)
- **Environment:** `Node`
- **Region:** Choose closest to your location
- **Branch:** `main`
- **Root Directory:** `frontend`

**Build & Deploy Settings:**
- **Build Command:** `npm install && npm run build:minimal`
- **Start Command:** `npm run serve`
- **Node Version:** `22` (or latest)

### 3. Environment Variables (Optional)
No special environment variables needed for basic deployment.

### 4. Advanced Settings
- **Auto-Deploy:** `Yes`
- **Health Check Path:** `/` (default)

## Build Commands Available

We have created multiple build options with different memory optimizations:

### Recommended (Minimal Memory):
```bash
npm run build:minimal
```
- Uses 1536MB memory limit
- Disables source maps
- Fastest build time

### Alternative Options:
```bash
npm run build:low-memory    # 2048MB, no source maps
npm run build:memory        # Custom build script
npm run build              # Standard 4096MB
```

## Troubleshooting

### Memory Issues
If build fails with "JavaScript heap out of memory":
1. Try `build:minimal` command (recommended)
2. If still fails, contact Render support for memory increase

### Build Errors
1. Check build logs in Render dashboard
2. Ensure Node.js version is 18 or higher
3. Verify all dependencies are in package.json

### Runtime Issues
1. Check if app starts correctly with `npm run serve`
2. Verify build folder exists after build process
3. Check start command uses correct serve configuration

## File Structure Created

```
frontend/
├── build-minimal.js        # Optimized build script
├── build-memory.js         # Alternative build script
├── .env.production         # Production environment variables
└── package.json           # Updated with serve script
```

## Success Indicators

✅ **Build Phase:**
- "Creating an optimized production build..."
- "Compiled with warnings." (warnings are OK)
- "The build folder is ready to be deployed."

✅ **Deploy Phase:**
- Service starts on port 10000 (Render default)
- App accessible at provided .onrender.com URL

## Final Steps

1. **Deploy:** Click "Create Web Service" in Render
2. **Monitor:** Watch build logs for completion
3. **Test:** Access your deployed URL
4. **Configure Domain:** (Optional) Set up custom domain

## Support

If deployment fails:
1. Check Render build logs
2. Verify GitHub repository permissions
3. Test build locally: `npm run build:minimal`
4. Contact support with specific error messages

---

🎉 **Your Fluent Messenger dApp will be live at:** `https://your-service-name.onrender.com`
