# Deploy to Production

Deploy the application to production using the deployment script.

## Steps

1. Check git status for uncommitted changes
2. If there are changes:
   - Stage all changes with `git add -A`
   - Create a commit with descriptive message (include Claude Code footer)
   - Push to GitHub (main branch)
3. Run the deployment script:
   ```bash
   ./deploy.sh --droplet-ip 104.236.100.157
   ```

## Deployment Script Options

- `--droplet-ip <IP>` - DigitalOcean droplet IP (required)
- `--ssh-user <USER>` - SSH username (default: root)
- `--app-dir <PATH>` - Application directory on server
- `--skip-nginx` - Skip nginx configuration
- `--dry-run` - Show what would be done without executing

## After Deployment

Report:
- Deployment URL: https://www.nebiswera.com
- Any warnings or errors from the script
- Health check status
