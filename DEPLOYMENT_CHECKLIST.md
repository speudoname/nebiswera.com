# Nebiswera Performance Optimization - Deployment Checklist

## Pre-Deployment

- [ ] Backup current production code
- [ ] Backup current nginx configuration
- [ ] Backup database (if making schema changes - not needed for this deployment)
- [ ] Note current PageSpeed Insights score for comparison

## Code Deployment

### 1. Build Locally (Recommended - Test First)
```bash
# Test build locally
npm run build

# Check for build errors
# Verify .next/standalone folder is created

# Test locally
HOSTNAME=0.0.0.0 node .next/standalone/server.js
# Visit http://localhost:3000 and test critical pages
```

- [ ] Local build succeeds
- [ ] Home page renders correctly
- [ ] Hero video loads with poster
- [ ] No console errors

### 2. Deploy to Droplet
```bash
# Option A: Git pull (if using Git deployment)
ssh user@your-droplet-ip
cd /var/www/nebiswera
git pull origin main
npm run build

# Option B: Direct copy (if building locally)
# From local machine:
rsync -avz --delete .next/standalone/ user@your-droplet-ip:/var/www/nebiswera/
rsync -avz .next/static/ user@your-droplet-ip:/var/www/nebiswera/.next/static/
rsync -avz public/ user@your-droplet-ip:/var/www/nebiswera/public/
```

- [ ] Code deployed successfully
- [ ] File permissions correct (www-data or appropriate user)

### 3. Restart Application
```bash
# On droplet
pm2 restart nebiswera
pm2 logs nebiswera --lines 50
```

- [ ] Application restarted without errors
- [ ] Logs show "Ready on http://0.0.0.0:3000" or similar

## Nginx Configuration

### 1. Install Dependencies
```bash
# On droplet
sudo apt update
sudo apt install -y nginx libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
```

- [ ] Nginx installed
- [ ] Brotli modules installed

### 2. Configure Nginx
```bash
# Copy nginx.conf from project
scp nginx.conf user@your-droplet-ip:/tmp/

# On droplet, backup and replace
sudo cp /etc/nginx/sites-available/nebiswera /etc/nginx/sites-available/nebiswera.backup
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/nebiswera

# IMPORTANT: Update SSL certificate paths in nginx.conf
sudo nano /etc/nginx/sites-available/nebiswera
# Change these lines to match your certificates:
# ssl_certificate /path/to/your/fullchain.pem;
# ssl_certificate_key /path/to/your/privkey.pem;

# Test configuration
sudo nginx -t
```

- [ ] Nginx config has correct SSL certificate paths
- [ ] `nginx -t` passes with no errors

### 3. Enable Brotli Module
```bash
# Edit main nginx.conf
sudo nano /etc/nginx/nginx.conf

# Add to top of http block:
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;
```

- [ ] Brotli modules loaded in nginx.conf

### 4. Create Cache Directory
```bash
sudo mkdir -p /var/cache/nginx
sudo chown -R www-data:www-data /var/cache/nginx
sudo chmod -R 755 /var/cache/nginx
```

- [ ] Cache directory created and permissions set

### 5. Reload Nginx
```bash
sudo systemctl reload nginx
# Or if modules were added:
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

- [ ] Nginx reloaded/restarted successfully
- [ ] No errors in `systemctl status nginx`

## CDN Configuration (Cloudflare R2)

### 1. Set Cache-Control Headers on R2 Assets

**For hero-video-poster.jpg:**
```bash
# Using rclone (if configured)
rclone copyto r2:your-bucket/hero-video-poster.jpg r2:your-bucket/hero-video-poster.jpg \
  --header "Cache-Control: public, max-age=31536000, immutable"

# OR using AWS CLI with R2 endpoint
aws s3 cp s3://your-bucket/hero-video-poster.jpg s3://your-bucket/hero-video-poster.jpg \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --cache-control "public, max-age=31536000, immutable" \
  --metadata-directive REPLACE
```

- [ ] hero-video-poster.jpg has Cache-Control header
- [ ] hero-video.mp4 has Cache-Control header (if applicable)

### 2. Verify CDN Headers
```bash
curl -I https://cdn.nebiswera.com/hero-video-poster.jpg
# Should see: Cache-Control: public, max-age=31536000, immutable
```

- [ ] CDN assets return correct Cache-Control headers

## Verification

### 1. Check Application
```bash
# Test home page
curl -I https://nebiswera.com
# Should return 200 OK

# Check if app is serving correctly
curl https://nebiswera.com | grep -i "nebiswera"
```

- [ ] Site loads correctly
- [ ] No 500/502/503 errors

### 2. Verify Compression
```bash
# Test Brotli
curl -I -H "Accept-Encoding: br" https://nebiswera.com
# Should see: Content-Encoding: br

# Test Gzip (fallback)
curl -I -H "Accept-Encoding: gzip" https://nebiswera.com
# Should see: Content-Encoding: gzip
```

- [ ] Brotli compression working
- [ ] Gzip compression working (fallback)

### 3. Verify Cache Headers
```bash
# Test static assets
curl -I https://nebiswera.com/_next/static/css/9e64d4dc94de649c.css
# Should see: Cache-Control: public, max-age=31536000, immutable

# Test after second request (cache hit)
curl -I https://nebiswera.com/_next/static/css/9e64d4dc94de649c.css
# Should see: X-Cache-Status: HIT
```

- [ ] Static assets have long cache headers
- [ ] Second request shows cache hit

### 4. Browser Testing
- [ ] Visit https://nebiswera.com in Chrome
- [ ] Open DevTools → Network tab
- [ ] Hard reload (Cmd+Shift+R / Ctrl+Shift+F5)
- [ ] Check:
  - [ ] Hero video poster loads quickly
  - [ ] CSS files have Cache-Control headers
  - [ ] Fonts load with `font-display: swap`
  - [ ] Response headers show `content-encoding: br` or `gzip`
  - [ ] No console errors

### 5. PageSpeed Insights
- [ ] Run test: https://pagespeed.web.dev/?url=https://nebiswera.com
- [ ] Check improvements:
  - [ ] "Render-blocking resources" warning gone or significantly reduced
  - [ ] "LCP element render delay" reduced from 2,030ms to <500ms
  - [ ] "Use efficient cache lifetimes" warning resolved
  - [ ] "Legacy JavaScript" reduced
  - [ ] Performance score improved (target: 90+)

### 6. Test Critical Pages
- [ ] Home page (/) loads correctly
- [ ] Georgian version (/ka) works
- [ ] English version (/en) works
- [ ] Login page (/ka/auth/login) works
- [ ] Dashboard (/ka/dashboard) works (if logged in)
- [ ] Admin panel (/admin) works

## Performance Baseline

**Before optimization:**
- Render-blocking CSS: 650ms
- Element render delay: 2,030ms
- Resource load delay: 380ms
- Font chain delay: 1,083ms

**After optimization (expected):**
- Render-blocking CSS: 0ms ✅
- Element render delay: <500ms ✅
- Resource load delay: <50ms ✅
- Font chain delay: <200ms ✅
- LCP: ~1.5s (down from ~4s) ✅

**Record actual results:**
- [ ] LCP: _______ (target: <2.5s)
- [ ] FCP: _______ (target: <1.8s)
- [ ] Performance Score: _______ (target: 90+)

## Rollback Plan (If Issues Occur)

### Rollback Code
```bash
# On droplet
cd /var/www/nebiswera
git reset --hard HEAD~1  # If using Git
pm2 restart nebiswera
```

### Rollback Nginx
```bash
sudo cp /etc/nginx/sites-available/nebiswera.backup /etc/nginx/sites-available/nebiswera
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Rollback plan tested and understood

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Check error logs: `pm2 logs nebiswera`
- [ ] Check nginx logs: `sudo tail -f /var/log/nginx/nebiswera-error.log`
- [ ] Monitor server resources: `htop`
- [ ] Check cache hit rate: `sudo tail -f /var/log/nginx/nebiswera-access.log | grep Cache`

### First Week
- [ ] Monitor Core Web Vitals in Google Search Console
- [ ] Check PageSpeed Insights daily
- [ ] Monitor user reports of issues
- [ ] Check analytics for bounce rate changes

## Common Issues & Solutions

### Issue: "Cannot read property of undefined" errors after deployment
**Solution:** Clear Next.js cache and rebuild
```bash
rm -rf .next
npm run build
pm2 restart nebiswera
```

### Issue: Fonts not loading
**Solution:** Check font files are in standalone build
```bash
ls -la .next/standalone/.next/static/media/
# Should see .woff2 font files
```

### Issue: 502 Bad Gateway
**Solution:** Check if Next.js is running
```bash
pm2 status
pm2 logs nebiswera
# Restart if needed
pm2 restart nebiswera
```

### Issue: Brotli not working
**Solution:** Verify module is loaded and nginx restarted (not just reloaded)
```bash
sudo nginx -V 2>&1 | grep brotli
sudo systemctl restart nginx
```

### Issue: Cache not hitting
**Solution:** Check cache directory permissions
```bash
sudo chown -R www-data:www-data /var/cache/nginx
sudo chmod -R 755 /var/cache/nginx
```

## Sign-Off

- [ ] All critical pages tested and working
- [ ] Performance improvements verified
- [ ] No console errors or warnings
- [ ] Rollback plan prepared
- [ ] Monitoring in place

**Deployed by:** ________________
**Date:** ________________
**Performance Score (before):** ________________
**Performance Score (after):** ________________

---

## Next Steps (Post-Deployment)

1. **Week 1:** Monitor Core Web Vitals in Search Console
2. **Week 2:** Analyze cache hit rates and optimize further
3. **Month 1:** Review and implement additional optimizations from PERFORMANCE_OPTIMIZATION.md (Advanced section)
4. **Ongoing:** Set up automated PageSpeed monitoring (e.g., Lighthouse CI)

