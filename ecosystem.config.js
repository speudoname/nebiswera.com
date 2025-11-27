/**
 * PM2 Ecosystem Configuration for Nebiswera
 *
 * This file configures PM2 process manager for production deployment
 * with cluster mode, auto-restart, and log management.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js --update-env
 *   pm2 delete ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'nebiswera',

      // Script to execute (standalone files are deployed directly to app root)
      script: 'server.js',

      // Current working directory
      cwd: '/var/www/nebiswera',

      // Cluster mode for load balancing
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        PORT: 3000,
      },

      // Restart configuration
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      max_restarts: 10, // Max number of unstable restarts
      min_uptime: '10s', // Min uptime before considering app as stable

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,

      // Logging
      error_file: '/var/log/pm2/nebiswera-error.log',
      out_file: '/var/log/pm2/nebiswera-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,

      // Advanced features
      listen_timeout: 10000, // Time to wait for app to be ready
      kill_timeout: 5000, // Time to wait before force kill

      // Source map support
      source_map_support: false,

      // Instance variable for cluster mode
      instance_var: 'INSTANCE_ID',

      // Post-deploy commands can be added here
      // post_update: ['npm install', 'npm run build'],
    },
  ],

  /**
   * Deployment configuration (optional)
   * Uncomment and configure if using PM2 deploy
   */
  // deploy: {
  //   production: {
  //     user: 'deploy',
  //     host: 'your-droplet-ip',
  //     ref: 'origin/main',
  //     repo: 'git@github.com:yourname/nebiswera.git',
  //     path: '/var/www/nebiswera',
  //     'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
  //   },
  // },
}
