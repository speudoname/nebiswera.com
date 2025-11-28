#!/bin/bash

###############################################################################
# Nebiswera Performance Optimization Deployment Script
#
# This script automates the full deployment process for DigitalOcean Droplet
#
# Usage: ./deploy.sh [options]
#   --droplet-ip <IP>     DigitalOcean droplet IP address
#   --ssh-user <USER>     SSH username (default: root)
#   --app-dir <PATH>      Application directory (default: /var/www/nebiswera)
#   --skip-build          Skip local build step
#   --skip-nginx          Skip nginx configuration
#   --dry-run             Show what would be done without executing
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DROPLET_IP=""
SSH_USER="root"
APP_DIR="/var/www/nebiswera"
SKIP_BUILD=false
SKIP_NGINX=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --droplet-ip)
      DROPLET_IP="$2"
      shift 2
      ;;
    --ssh-user)
      SSH_USER="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-nginx)
      SKIP_NGINX=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$DROPLET_IP" ]; then
  echo -e "${RED}Error: --droplet-ip is required${NC}"
  echo "Usage: ./deploy.sh --droplet-ip <IP> [--ssh-user <USER>]"
  exit 1
fi

SSH_TARGET="${SSH_USER}@${DROPLET_IP}"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

run_command() {
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would execute: $1"
  else
    log_info "Executing: $1"
    eval "$1"
  fi
}

ssh_exec() {
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would SSH execute: $1"
  else
    ssh "$SSH_TARGET" "$1"
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

log_info "Starting Nebiswera deployment to $SSH_TARGET"
log_info "Application directory: $APP_DIR"
echo ""

# Check if we can connect to droplet
log_info "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SSH_TARGET" "echo 'SSH connection successful'" 2>/dev/null; then
  log_error "Cannot connect to $SSH_TARGET"
  log_error "Please ensure SSH key authentication is set up"
  exit 1
fi
log_success "SSH connection verified"

# Check if required files exist locally
log_info "Checking required files..."
REQUIRED_FILES=(
  "package.json"
  "next.config.js"
  "nginx.conf"
  "ecosystem.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    log_error "Required file not found: $file"
    exit 1
  fi
done
log_success "All required files found"

###############################################################################
# Step 1: Build Application Locally
###############################################################################

if [ "$SKIP_BUILD" = false ]; then
  log_info "Step 1/6: Building application locally..."
  echo ""

  # Clean previous build
  log_info "Cleaning previous build..."
  run_command "rm -rf .next"

  # Install dependencies
  log_info "Installing dependencies..."
  run_command "npm install"

  # Build Next.js
  log_info "Building Next.js application..."
  run_command "npm run build"

  # Verify build
  if [ "$DRY_RUN" = false ] && [ ! -d ".next/standalone" ]; then
    log_error "Build failed: .next/standalone directory not found"
    exit 1
  fi

  log_success "Application built successfully"
  echo ""
else
  log_warning "Skipping build step (--skip-build flag)"
  echo ""
fi

###############################################################################
# Step 2: Backup Current Deployment
###############################################################################

log_info "Step 2/6: Creating backup of current deployment..."
echo ""

BACKUP_DIR="${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"

ssh_exec "if [ -d '$APP_DIR' ]; then \
  echo 'Creating backup at $BACKUP_DIR'; \
  sudo cp -r '$APP_DIR' '$BACKUP_DIR'; \
  echo 'Backup created successfully'; \
else \
  echo 'No existing deployment found, skipping backup'; \
fi"

log_success "Backup completed"
echo ""

###############################################################################
# Step 3: Deploy Application Files
###############################################################################

log_info "Step 3/6: Deploying application files..."
echo ""

# Create app directory if it doesn't exist
ssh_exec "sudo mkdir -p $APP_DIR"

# Copy standalone build (exclude .env to preserve production config)
log_info "Copying standalone build..."
run_command "rsync -avz --delete --exclude='.env' .next/standalone/ ${SSH_TARGET}:${APP_DIR}/"

# Copy static files
log_info "Copying static files..."
run_command "rsync -avz .next/static/ ${SSH_TARGET}:${APP_DIR}/.next/static/"

# Copy public files
log_info "Copying public directory..."
run_command "rsync -avz public/ ${SSH_TARGET}:${APP_DIR}/public/"

# Copy package.json for reference
run_command "scp package.json ${SSH_TARGET}:${APP_DIR}/"

# Copy ecosystem.config.js for PM2
run_command "scp ecosystem.config.js ${SSH_TARGET}:${APP_DIR}/"

# Set correct permissions
ssh_exec "sudo chown -R www-data:www-data $APP_DIR 2>/dev/null || sudo chown -R $SSH_USER:$SSH_USER $APP_DIR"

log_success "Application files deployed"
echo ""

###############################################################################
# Step 4: Install Dependencies on Server
###############################################################################

log_info "Step 4/6: Installing server dependencies..."
echo ""

# Install Node.js if not present
ssh_exec "if ! command -v node &> /dev/null; then \
  echo 'Installing Node.js...'; \
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -; \
  sudo apt-get install -y nodejs; \
fi"

# Install PM2 globally if not present
ssh_exec "if ! command -v pm2 &> /dev/null; then \
  echo 'Installing PM2...'; \
  sudo npm install -g pm2; \
fi"

log_success "Server dependencies installed"
echo ""

###############################################################################
# Step 5: Configure and Restart PM2
###############################################################################

log_info "Step 5/6: Configuring PM2..."
echo ""

# Stop existing PM2 process if running
ssh_exec "cd $APP_DIR && pm2 delete nebiswera 2>/dev/null || true"

# Start with new configuration
ssh_exec "cd $APP_DIR && pm2 start ecosystem.config.js"

# Save PM2 configuration
ssh_exec "pm2 save"

# Setup PM2 startup script
ssh_exec "sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER 2>/dev/null || true"

# Wait for app to start
log_info "Waiting for application to start..."
sleep 5

# Check PM2 status
ssh_exec "pm2 status"

# Check logs for errors
log_info "Recent application logs:"
ssh_exec "pm2 logs nebiswera --lines 20 --nostream"

log_success "PM2 configured and application started"
echo ""

###############################################################################
# Step 6: Configure Nginx
###############################################################################

if [ "$SKIP_NGINX" = false ]; then
  log_info "Step 6/6: Configuring Nginx..."
  echo ""

  # Install Nginx if not present
  ssh_exec "if ! command -v nginx &> /dev/null; then \
    echo 'Installing Nginx...'; \
    sudo apt-get update; \
    sudo apt-get install -y nginx libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static; \
  fi"

  # Backup existing nginx config
  ssh_exec "if [ -f /etc/nginx/sites-available/nebiswera ]; then \
    sudo cp /etc/nginx/sites-available/nebiswera /etc/nginx/sites-available/nebiswera.backup.\$(date +%Y%m%d_%H%M%S); \
  fi"

  # Copy new nginx config
  run_command "scp nginx.conf ${SSH_TARGET}:/tmp/nebiswera.nginx.conf"

  # Move to sites-available
  ssh_exec "sudo mv /tmp/nebiswera.nginx.conf /etc/nginx/sites-available/nebiswera"

  # Create symbolic link if it doesn't exist
  ssh_exec "sudo ln -sf /etc/nginx/sites-available/nebiswera /etc/nginx/sites-enabled/nebiswera 2>/dev/null || true"

  # Remove default nginx site if present
  ssh_exec "sudo rm -f /etc/nginx/sites-enabled/default"

  # Create cache directory
  ssh_exec "sudo mkdir -p /var/cache/nginx"
  ssh_exec "sudo chown -R www-data:www-data /var/cache/nginx"
  ssh_exec "sudo chmod -R 755 /var/cache/nginx"

  # Test nginx configuration
  log_info "Testing Nginx configuration..."
  ssh_exec "sudo nginx -t"

  # Reload nginx
  log_info "Reloading Nginx..."
  ssh_exec "sudo systemctl reload nginx"

  log_success "Nginx configured successfully"
  echo ""
else
  log_warning "Skipping Nginx configuration (--skip-nginx flag)"
  echo ""
fi

###############################################################################
# Post-Deployment Verification
###############################################################################

log_info "Running post-deployment verification..."
echo ""

# Check if app is running
log_info "Checking application status..."
ssh_exec "pm2 status nebiswera"

# Check if nginx is running
if [ "$SKIP_NGINX" = false ]; then
  log_info "Checking Nginx status..."
  ssh_exec "sudo systemctl status nginx --no-pager | head -10"
fi

# Test HTTP response
log_info "Testing HTTP response..."
sleep 2
if ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" | grep -q "200"; then
  log_success "Application is responding correctly"
else
  log_warning "Application may not be responding correctly"
fi

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify your site is working: https://nebiswera.com"
echo "2. Run PageSpeed Insights: https://pagespeed.web.dev/?url=https://nebiswera.com"
echo "3. Check application logs: ssh $SSH_TARGET 'pm2 logs nebiswera'"
echo "4. Monitor performance: ssh $SSH_TARGET 'pm2 monit'"
echo ""
echo "Important notes:"
echo "- Backup created at: $BACKUP_DIR"
echo "- To rollback: ssh $SSH_TARGET 'sudo cp -r $BACKUP_DIR $APP_DIR && pm2 restart nebiswera'"
echo "- To view logs: ssh $SSH_TARGET 'pm2 logs nebiswera'"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Update SSL certificate paths in /etc/nginx/sites-available/nebiswera"
echo "2. Set Cache-Control headers on Cloudflare R2 assets"
echo "3. Test all critical pages"
echo ""
log_success "All done! 🚀"
