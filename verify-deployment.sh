#!/bin/bash

###############################################################################
# Nebiswera Deployment Verification Script
#
# This script verifies that the deployment was successful and all
# optimizations are working correctly.
#
# Usage: ./verify-deployment.sh --url https://nebiswera.com
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
URL="https://nebiswera.com"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      URL="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

check_requirement() {
  if ! command -v "$1" &> /dev/null; then
    log_error "$1 is not installed. Please install it first."
    exit 1
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

log_info "Verifying deployment for: $URL"
echo ""

# Check required tools
check_requirement "curl"

###############################################################################
# Test 1: Basic Connectivity
###############################################################################

log_info "Test 1: Checking basic connectivity..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10 || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  log_success "Site is reachable (HTTP $HTTP_CODE)"
else
  log_error "Site returned HTTP $HTTP_CODE"
  exit 1
fi

###############################################################################
# Test 2: HTTPS and Security Headers
###############################################################################

log_info "Test 2: Checking HTTPS and security headers..."

# Check if HTTPS redirects correctly
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "http://nebiswera.com" --max-time 10 || echo "000")
if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
  log_success "HTTP to HTTPS redirect working (HTTP $HTTP_REDIRECT)"
else
  log_warning "HTTP redirect may not be configured (HTTP $HTTP_REDIRECT)"
fi

# Check security headers
HEADERS=$(curl -s -I "$URL" --max-time 10)

if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  log_success "HSTS header present"
else
  log_warning "HSTS header missing"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options.*nosniff"; then
  log_success "X-Content-Type-Options header present"
else
  log_warning "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-frame-options"; then
  log_success "X-Frame-Options header present"
else
  log_warning "X-Frame-Options header missing"
fi

###############################################################################
# Test 3: Compression
###############################################################################

log_info "Test 3: Checking compression..."

# Test Brotli
BROTLI_HEADER=$(curl -s -I -H "Accept-Encoding: br" "$URL" --max-time 10 | grep -i "content-encoding" || echo "")
if echo "$BROTLI_HEADER" | grep -qi "br"; then
  log_success "Brotli compression enabled"
elif echo "$BROTLI_HEADER" | grep -qi "gzip"; then
  log_warning "Brotli not available, but Gzip is working"
else
  log_warning "No compression detected"
fi

###############################################################################
# Test 4: Cache Headers for Static Assets
###############################################################################

log_info "Test 4: Checking cache headers..."

# Try to find a static asset
STATIC_ASSET=$(curl -s "$URL" | grep -o '/_next/static/[^"]*\.js' | head -1 || echo "")

if [ -n "$STATIC_ASSET" ]; then
  CACHE_HEADER=$(curl -s -I "${URL}${STATIC_ASSET}" --max-time 10 | grep -i "cache-control" || echo "")

  if echo "$CACHE_HEADER" | grep -qi "max-age=31536000\|immutable"; then
    log_success "Static assets have long cache lifetime"
    [ "$VERBOSE" = true ] && echo "    $CACHE_HEADER"
  else
    log_warning "Static assets cache headers may not be optimal"
    [ "$VERBOSE" = true ] && echo "    $CACHE_HEADER"
  fi
else
  log_warning "Could not find static asset to test cache headers"
fi

###############################################################################
# Test 5: Critical CSS Inline
###############################################################################

log_info "Test 5: Checking critical CSS inline..."

HTML_CONTENT=$(curl -s "$URL" --max-time 10)

if echo "$HTML_CONTENT" | grep -q "<style.*Critical CSS"; then
  log_success "Critical CSS is inlined in HTML"
else
  log_warning "Critical CSS inline not detected (may be normal if not on home page)"
fi

###############################################################################
# Test 6: Font Loading Strategy
###############################################################################

log_info "Test 6: Checking font loading strategy..."

if echo "$HTML_CONTENT" | grep -q "font-display.*swap\|display.*swap"; then
  log_success "Font display swap detected"
else
  log_warning "Font display swap not detected in HTML"
fi

###############################################################################
# Test 7: Resource Hints
###############################################################################

log_info "Test 7: Checking resource hints (preconnect, dns-prefetch)..."

PRECONNECT_COUNT=$(echo "$HTML_CONTENT" | grep -c "rel=\"preconnect\"" || echo "0")
DNS_PREFETCH_COUNT=$(echo "$HTML_CONTENT" | grep -c "rel=\"dns-prefetch\"" || echo "0")
PRELOAD_COUNT=$(echo "$HTML_CONTENT" | grep -c "rel=\"preload\"" || echo "0")

if [ "$PRECONNECT_COUNT" -gt 0 ]; then
  log_success "Preconnect hints found ($PRECONNECT_COUNT)"
else
  log_warning "No preconnect hints detected"
fi

if [ "$DNS_PREFETCH_COUNT" -gt 0 ]; then
  log_success "DNS prefetch hints found ($DNS_PREFETCH_COUNT)"
else
  log_warning "No DNS prefetch hints detected"
fi

if [ "$PRELOAD_COUNT" -gt 0 ]; then
  log_success "Preload hints found ($PRELOAD_COUNT)"
else
  log_warning "No preload hints detected"
fi

###############################################################################
# Test 8: CDN Assets
###############################################################################

log_info "Test 8: Checking CDN assets..."

# Test hero video poster
CDN_ASSET="https://cdn.nebiswera.com/hero-video-poster.jpg"
CDN_RESPONSE=$(curl -s -I "$CDN_ASSET" --max-time 10 || echo "")

if echo "$CDN_RESPONSE" | grep -qi "HTTP.*200"; then
  log_success "CDN assets are accessible"

  CDN_CACHE=$(echo "$CDN_RESPONSE" | grep -i "cache-control" || echo "")
  if echo "$CDN_CACHE" | grep -qi "max-age"; then
    log_success "CDN assets have cache headers"
    [ "$VERBOSE" = true ] && echo "    $CDN_CACHE"
  else
    log_warning "CDN assets may not have optimal cache headers"
  fi
else
  log_warning "Could not verify CDN assets"
fi

###############################################################################
# Test 9: Response Time
###############################################################################

log_info "Test 9: Checking response time..."

RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL" --max-time 10 || echo "0")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d'.' -f1)

if [ "$RESPONSE_TIME_MS" -lt 1000 ]; then
  log_success "Fast response time: ${RESPONSE_TIME_MS}ms"
elif [ "$RESPONSE_TIME_MS" -lt 2000 ]; then
  log_warning "Moderate response time: ${RESPONSE_TIME_MS}ms"
else
  log_warning "Slow response time: ${RESPONSE_TIME_MS}ms"
fi

###############################################################################
# Test 10: Locale Support
###############################################################################

log_info "Test 10: Checking locale support..."

# Test Georgian locale
KA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/ka" --max-time 10 || echo "000")
if [ "$KA_RESPONSE" = "200" ]; then
  log_success "Georgian locale (/ka) accessible"
else
  log_warning "Georgian locale returned HTTP $KA_RESPONSE"
fi

# Test English locale
EN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/en" --max-time 10 || echo "000")
if [ "$EN_RESPONSE" = "200" ]; then
  log_success "English locale (/en) accessible"
else
  log_warning "English locale returned HTTP $EN_RESPONSE"
fi

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Verification Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run Google PageSpeed Insights: https://pagespeed.web.dev/?url=$URL"
echo "2. Test all critical user flows manually"
echo "3. Monitor error logs for any issues"
echo "4. Check Core Web Vitals in Google Search Console"
echo ""
echo "Performance testing tools:"
echo "- PageSpeed Insights: https://pagespeed.web.dev/"
echo "- WebPageTest: https://www.webpagetest.org/"
echo "- GTmetrix: https://gtmetrix.com/"
echo ""

if [ "$VERBOSE" = false ]; then
  echo -e "${BLUE}Tip: Run with --verbose flag for detailed output${NC}"
fi
