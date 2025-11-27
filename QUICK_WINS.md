# Performance Quick Wins - Nebiswera

## TL;DR - Do These First (5 Minutes)

If you only have 5 minutes, do these in order:

### 1. Deploy Code Changes (2 min)
```bash
# On your DigitalOcean droplet
cd /var/www/nebiswera
git pull origin main  # Or upload the updated files
npm run build
pm2 restart nebiswera
```

**Impact:** Eliminates 650ms render-blocking CSS, fixes font loading

---

### 2. Add Nginx Cache Headers (2 min)
```bash
# Edit your existing nginx config
sudo nano /etc/nginx/sites-available/nebiswera

# Add this inside your server block (before existing location blocks):
```
```nginx
location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
    expires 1y;
}
```
```bash
# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

**Impact:** Fixes cache warnings, speeds up repeat visits

---

### 3. Fix CDN Cache Headers (1 min)
In your Cloudflare R2 dashboard:
1. Navigate to your bucket
2. Select `hero-video-poster.jpg`
3. Edit metadata
4. Add: `Cache-Control: public, max-age=31536000, immutable`
5. Save

**Impact:** Reduces LCP resource load delay from 380ms to ~0ms

---

## Expected Results After These 3 Steps

| Metric | Before | After | Time Saved |
|--------|--------|-------|------------|
| Render-blocking CSS | 650ms | 0ms | ✅ 650ms |
| LCP Resource Load | 380ms | ~0ms | ✅ 380ms |
| Font Loading Chain | 1,083ms | ~200ms | ✅ 883ms |
| Cache Warnings | Yes | No | ✅ Fixed |
| **Total LCP Improvement** | ~4s | **~2s** | ✅ **2 seconds faster** |

---

## Verify It Worked (30 seconds)

1. Open https://nebiswera.com
2. Open DevTools (F12) → Network tab
3. Hard reload (Ctrl+Shift+R)
4. Check:
   - CSS files load but don't block render (look for inline `<style>` in HTML)
   - `/_next/static/` files show `Cache-Control: public, max-age=31536000`
   - Hero video poster loads immediately

---

## Full Optimization (30 Minutes)

For maximum performance, follow the complete deployment checklist:

1. **Read:** `PERFORMANCE_OPTIMIZATION.md` (5 min)
2. **Deploy:** Full nginx config from `nginx.conf` (10 min)
3. **Configure:** Brotli compression (5 min)
4. **Test:** Run PageSpeed Insights (5 min)
5. **Verify:** Use deployment checklist (5 min)

**Expected Final Result:**
- PageSpeed Performance Score: **90+** (was ~70)
- LCP: **<1.5s** (was ~4s)
- FCP: **<1s** (was ~1.5s)

---

## Troubleshooting

### "I deployed but PageSpeed still shows issues"

**Check 1:** Clear browser cache and test in incognito
**Check 2:** Wait 5 minutes for CDN propagation
**Check 3:** Hard refresh PageSpeed Insights (it caches results)

### "Nginx won't reload"

```bash
# Check for syntax errors
sudo nginx -t

# If errors, restore backup
sudo cp /etc/nginx/sites-available/nebiswera.backup /etc/nginx/sites-available/nebiswera
sudo systemctl reload nginx
```

### "Site is down after deployment"

```bash
# Check if Next.js is running
pm2 status

# Check logs
pm2 logs nebiswera --lines 50

# Restart if needed
pm2 restart nebiswera
```

---

## Priority Order (If You Can't Do Everything)

**Priority 1 (Must-have):**
1. ✅ Deploy code changes (layout.tsx, HomeClient.tsx, next.config.js)
2. ✅ Add basic nginx cache headers for `/_next/static/`
3. ✅ Fix CDN cache headers for hero-video-poster.jpg

**Priority 2 (High impact):**
4. ✅ Install and configure Brotli compression
5. ✅ Deploy full nginx.conf with all optimizations

**Priority 3 (Nice-to-have):**
6. Set up monitoring (Google Search Console)
7. Implement advanced optimizations (service worker, lazy loading)

---

## Measuring Success

### Before Deployment
Run: https://pagespeed.web.dev/?url=https://nebiswera.com
- Record Performance Score: ___
- Record LCP: ___
- Record FCP: ___

### After Deployment
Wait 5 minutes, then run again:
- New Performance Score: ___
- New LCP: ___
- New FCP: ___

**Target:**
- Performance Score: 90+ (mobile), 95+ (desktop)
- LCP: <2.5s (Good)
- FCP: <1.8s (Good)

---

## One-Liner Deployment

If you're already set up with Git and PM2:

```bash
ssh user@droplet "cd /var/www/nebiswera && git pull && npm run build && pm2 restart nebiswera" && \
scp nginx.conf user@droplet:/tmp/ && \
ssh user@droplet "sudo mv /tmp/nginx.conf /etc/nginx/sites-available/nebiswera && sudo nginx -t && sudo systemctl reload nginx"
```

---

## Support

If stuck:
1. Check `DEPLOYMENT_CHECKLIST.md` for step-by-step instructions
2. Check logs: `pm2 logs nebiswera` and `sudo tail -f /var/log/nginx/error.log`
3. Review `PERFORMANCE_OPTIMIZATION.md` for detailed explanations

---

**Remember:** Even just doing the first 3 quick wins will give you a ~2 second LCP improvement! 🚀
