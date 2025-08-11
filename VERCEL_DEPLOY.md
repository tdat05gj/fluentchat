# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Method 1: One-Click Deploy via Git
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your GitHub repository: `tdat05gj/fluentchat`
3. Configure project settings (see below)
4. Deploy!

### Method 2: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Project Configuration

### Build Settings
- **Framework Preset:** Other
- **Root Directory:** Leave empty (monorepo setup)
- **Build Command:** `npm run build:vercel`
- **Output Directory:** `frontend/build`
- **Install Command:** `npm install`

### Environment Variables
No environment variables required for basic deployment.

### Advanced Settings
- **Node.js Version:** 18.x or higher
- **Output Directory:** `frontend/build`

## Custom vercel.json Configuration

Your project includes a `vercel.json` with optimized settings:
- ✅ SPA routing support
- ✅ Static file caching
- ✅ Memory-optimized build process
- ✅ Proper asset handling

## Build Process

The deployment uses `npm run build:vercel` which:
1. Installs dependencies in frontend folder
2. Runs memory-optimized build (`build:minimal`)
3. Outputs to `frontend/build`
4. Serves static files efficiently

## Deployment Structure

```
Project Root/
├── vercel.json          # Vercel configuration
├── package.json         # Root package with build scripts
├── frontend/
│   ├── build/           # Output directory (auto-generated)
│   ├── package.json     # Frontend dependencies
│   └── src/             # React source code
└── contracts/           # Smart contracts (ignored in deployment)
```

## Files Excluded from Deployment

Via `.vercelignore`:
- Source files (`frontend/src/`)
- Node modules caches
- Development configurations
- Smart contract files
- Documentation files

## Post-Deployment

### Your app will be available at:
`https://your-project-name.vercel.app`

### Custom Domain (Optional):
1. Go to Vercel dashboard → Domains
2. Add your custom domain
3. Configure DNS settings

## Troubleshooting

### Build Failures:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Memory Issues:
- Project uses memory-optimized build script
- If issues persist, upgrade Vercel plan

### Routing Issues:
- SPA routing is configured in `vercel.json`
- All routes redirect to `index.html`

## Performance Optimizations

✅ **Enabled:**
- Static file caching (1 year)
- Gzip compression
- CDN distribution
- Memory-optimized builds
- Source map exclusion

## Monitoring

- Check deployment status in Vercel dashboard
- View analytics and performance metrics
- Monitor error logs and user feedback

---

🎉 **Your Fluent Messenger dApp will be live at your Vercel URL!**
