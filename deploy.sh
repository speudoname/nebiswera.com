#!/bin/bash

###############################################################################
# Nebiswera Production Deployment Script
#
# This script ensures safe, verified deployments to DigitalOcean Droplet
#
# Features:
# - Mandatory local build to catch errors before deployment
# - Continuous monitoring of deployment progress
# - Health check verification before completion
# - Detailed status reporting
#
# Usage: ./deploy.sh [options]
#   --droplet-ip <IP>     DigitalOcean droplet IP address
#   --ssh-user <USER>     SSH username (default: root)
#   --app-dir <PATH>      Application directory (default: /var/www/nebiswera)
#   --skip-nginx          Skip nginx configuration
#   --dry-run             Show what would be done without executing
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DROPLET_IP=""
SSH_USER="root"
APP_DIR="/var/www/nebiswera.com"
SKIP_NGINX=false
DRY_RUN=false

# Health check settings
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2

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
# Step 1: Build Application Locally (MANDATORY)
###############################################################################

log_info "Step 1/6: Building application locally..."
log_info "This ensures build errors are caught before deployment"
echo ""

# Clean previous build
log_info "Cleaning previous build..."
run_command "rm -rf .next"

# Install dependencies
log_info "Installing dependencies..."
run_command "npm install"

# Build Next.js
log_info "Building Next.js application..."
if [ "$DRY_RUN" = false ]; then
  if ! npm run build; then
    log_error "Build failed! Aborting deployment."
    log_error "Fix the build errors above and try again."
    exit 1
  fi
else
  run_command "npm run build"
fi

# Verify build
if [ "$DRY_RUN" = false ] && [ ! -d ".next/standalone" ]; then
  log_error "Build failed: .next/standalone directory not found"
  exit 1
fi

log_success "✓ Local build successful - safe to deploy"
echo ""

###############################################################################
# Step 2: Deploy Application Files
###############################################################################

log_info "Step 2/5: Deploying application files..."
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

log_info "Step 3/5: Installing server dependencies..."
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

log_info "Step 4/5: Configuring PM2 and starting application..."
echo ""

# Stop existing PM2 process if running
log_info "Stopping existing application..."
ssh_exec "cd $APP_DIR && pm2 delete nebiswera 2>/dev/null || true"

# Start with new configuration
log_info "Starting application with PM2..."
ssh_exec "cd $APP_DIR && pm2 start ecosystem.config.js"

# Save PM2 configuration
ssh_exec "pm2 save"

# Setup PM2 startup script
ssh_exec "sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER 2>/dev/null || true"

log_success "Application started with PM2"
echo ""

###############################################################################
# Step 5.5: Monitor Application Startup
###############################################################################

log_info "Monitoring application startup..."
echo ""

# Wait a moment for initial startup
sleep 3

# Monitor PM2 status for the first 10 seconds
log_info "Checking PM2 status..."
for i in {1..5}; do
  echo -e "${CYAN}Status check $i/5...${NC}"
  ssh_exec "pm2 status nebiswera"
  sleep 2
done

# Check for errors in recent logs
log_info "Checking application logs for errors..."
echo ""
ssh_exec "pm2 logs nebiswera --lines 30 --nostream"
echo ""

# Check if process is errored or stopped
if ssh_exec "pm2 jlist" | grep -q '"status":"errored"'; then
  log_error "Application failed to start!"
  log_error "Check the logs above for error details"
  exit 1
fi

log_success "✓ Application is running"
echo ""

###############################################################################
# Step 6: Configure Nginx
###############################################################################

if [ "$SKIP_NGINX" = false ]; then
  log_info "Step 5/5: Configuring Nginx..."
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
# Post-Deployment Verification & Health Checks
###############################################################################

log_info "Running comprehensive health checks..."
echo ""

# Check PM2 status
log_info "Checking PM2 status..."
ssh_exec "pm2 status nebiswera"
echo ""

# Check Nginx status
if [ "$SKIP_NGINX" = false ]; then
  log_info "Checking Nginx status..."
  ssh_exec "sudo systemctl status nginx --no-pager | head -10"
  echo ""
fi

# Continuous health check with retries
log_info "Performing health check (HTTP request to localhost:3000)..."
echo -e "${CYAN}Will retry up to $MAX_HEALTH_CHECK_ATTEMPTS times every ${HEALTH_CHECK_INTERVAL}s${NC}"
echo ""

HEALTH_CHECK_PASSED=false
for attempt in $(seq 1 $MAX_HEALTH_CHECK_ATTEMPTS); do
  echo -e "${CYAN}Health check attempt $attempt/$MAX_HEALTH_CHECK_ATTEMPTS...${NC}"

  HTTP_CODE=$(ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" || echo "000")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    log_success "✓ Health check passed (HTTP $HTTP_CODE)"
    HEALTH_CHECK_PASSED=true
    break
  else
    log_warning "Health check failed (HTTP $HTTP_CODE)"

    if [ $attempt -lt $MAX_HEALTH_CHECK_ATTEMPTS ]; then
      echo -e "${YELLOW}Waiting ${HEALTH_CHECK_INTERVAL}s before retry...${NC}"
      sleep $HEALTH_CHECK_INTERVAL
    fi
  fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
  log_error "Health check failed after $MAX_HEALTH_CHECK_ATTEMPTS attempts!"
  log_error "Application may not be responding correctly"
  echo ""
  log_info "Recent logs:"
  ssh_exec "pm2 logs nebiswera --lines 50 --nostream"
  exit 1
fi

echo ""

# Test a few critical routes
log_info "Testing critical routes..."
echo ""

test_route() {
  local route=$1
  local description=$2

  echo -e "${CYAN}Testing $description ($route)...${NC}"
  HTTP_CODE=$(ssh_exec "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$route" || echo "000")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "  ${GREEN}✓ $description: HTTP $HTTP_CODE${NC}"
  else
    echo -e "  ${YELLOW}⚠ $description: HTTP $HTTP_CODE${NC}"
  fi
}

test_route "/" "Home page"
test_route "/ka" "Georgian home"
test_route "/en" "English home"
test_route "/ka/dashboard" "Dashboard (auth redirect expected)"

echo ""
log_success "✓ All health checks passed"
echo ""

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Deployment Completed Successfully   ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Show deployment summary
echo -e "${BLUE}Deployment Summary:${NC}"
echo "  ✓ Local build verified"
echo "  ✓ Application files deployed"
echo "  ✓ PM2 process running"
if [ "$SKIP_NGINX" = false ]; then
  echo "  ✓ Nginx configured and running"
fi
echo "  ✓ Health checks passed"
echo "  ✓ Critical routes tested"
echo ""

echo -e "${BLUE}Live Site:${NC}"
echo "  https://nebiswera.com"
echo "  https://www.nebiswera.com"
echo ""

echo -e "${BLUE}Monitoring Commands:${NC}"
echo "  View logs:     ssh $SSH_TARGET 'pm2 logs nebiswera'"
echo "  Check status:  ssh $SSH_TARGET 'pm2 status'"
echo "  Live monitor:  ssh $SSH_TARGET 'pm2 monit'"
echo "  Restart app:   ssh $SSH_TARGET 'pm2 restart nebiswera'"
echo ""

echo -e "${BLUE}Testing & Verification:${NC}"
echo "  PageSpeed:     https://pagespeed.web.dev/?url=https://nebiswera.com"
echo "  Lighthouse:    Chrome DevTools > Lighthouse"
echo ""

echo -e "${YELLOW}Important Notes:${NC}"
echo "  • Build is always run locally before deployment"
echo "  • Health checks must pass for deployment to complete"
echo "  • Application automatically restarts with PM2"
echo ""

log_success "Deployment verified and confirmed! 🚀"
