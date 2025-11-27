# Deploy to Production

Deploy the current code to production (GitHub + DigitalOcean Droplet).

## Steps to perform:

1. **Check for uncommitted changes** - if there are any, stage and commit them with an appropriate message
2. **Push to GitHub** - push the main branch to origin
3. **Deploy to droplet** - run the deploy script with:
   - Droplet IP: `104.236.100.157`
   - SSH User: `root`
   - Use `--skip-nginx` flag (nginx config rarely changes)

## Commands to run:

```bash
# 1. Check git status and commit if needed
git add -A
git status

# If there are changes, commit them:
git commit -m "Deploy: [describe changes]"

# 2. Push to GitHub
git push origin main

# 3. Deploy to droplet
./deploy.sh --droplet-ip 104.236.100.157 --skip-nginx
```

## Important notes:
- The deploy.sh script will handle building, deploying, and restarting PM2
- Nginx config is skipped by default since it rarely changes (use `--skip-nginx`)
- To include nginx config changes, remove the `--skip-nginx` flag
- Check https://nebiswera.com after deployment to verify
