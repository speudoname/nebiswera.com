# Deploy to Production

Deploy the application to production droplet:

1. Check git status and warn about uncommitted changes
2. Stage all changes with `git add -A`
3. Create a commit with descriptive message about what changed
4. Push to GitHub (main branch)
5. Build application locally
6. Deploy to droplet at 104.236.100.157
7. Verify deployment success

The commit message should:
- Summarize what changed (features, fixes, updates)
- Include the Claude Code footer with co-authorship
- Be concise but descriptive

After deployment completes, report the deployment URL and any warnings.
