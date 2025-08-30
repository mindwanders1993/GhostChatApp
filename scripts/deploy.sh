#!/bin/bash

# GhostChatApp Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -euo pipefail

ENVIRONMENT="${1:-staging}"
PROJECT_DIR="/opt/ghostchatapp"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/ghostchatapp-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as correct user
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Environment must be either 'staging' or 'production'"
fi

# Check if required files exist
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
    error "Docker compose file $COMPOSE_FILE not found"
fi

if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file $ENV_FILE not found"
fi

log "Starting deployment to $ENVIRONMENT environment"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Pre-deployment health check
log "Running pre-deployment health check"
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log "Services are currently running, performing rolling update"
    
    # Backup database before deployment
    log "Creating database backup"
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U chatuser -d chatapp > "$BACKUP_FILE"; then
        log "Database backup created: $BACKUP_FILE"
        gzip "$BACKUP_FILE"
        log "Database backup compressed: ${BACKUP_FILE}.gz"
    else
        error "Database backup failed"
    fi
    
    # Keep only last 7 backups
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
else
    log "No services currently running, performing fresh deployment"
fi

# Pull latest code
log "Pulling latest code from repository"
if ! git pull origin main; then
    error "Failed to pull latest code"
fi

# Validate docker-compose file
log "Validating docker-compose configuration"
if ! docker-compose -f "$COMPOSE_FILE" config > /dev/null; then
    error "Docker compose configuration is invalid"
fi

# Pull latest images
log "Pulling latest Docker images"
if ! docker-compose -f "$COMPOSE_FILE" pull; then
    error "Failed to pull Docker images"
fi

# Build and start services
log "Building and starting services"
if ! docker-compose -f "$COMPOSE_FILE" up -d --build --remove-orphans; then
    error "Failed to start services"
fi

# Wait for services to be healthy
log "Waiting for services to become healthy"
sleep 30

# Health check function
health_check() {
    local url="$1"
    local service="$2"
    
    log "Checking health of $service at $url"
    
    for i in {1..12}; do
        if curl -f -s "$url" > /dev/null; then
            log "$service health check passed"
            return 0
        fi
        log "Health check attempt $i/12 failed, waiting 10 seconds..."
        sleep 10
    done
    
    error "$service failed health check after 2 minutes"
}

# Run health checks
if [[ "$ENVIRONMENT" == "production" ]]; then
    health_check "https://yourdomain.com/health" "Frontend"
    health_check "https://api.yourdomain.com/health" "Backend API"
else
    health_check "http://staging.yourdomain.com/health" "Frontend"
    health_check "http://api-staging.yourdomain.com/health" "Backend API"
fi

# Run database migrations if needed
log "Running database migrations"
if ! docker-compose -f "$COMPOSE_FILE" exec -T backend python -m alembic upgrade head; then
    warn "Database migrations failed or not needed"
fi

# Clean up old Docker resources
log "Cleaning up old Docker resources"
docker system prune -f
docker volume prune -f

# Log service status
log "Final service status:"
docker-compose -f "$COMPOSE_FILE" ps

# Send notification (if webhook configured)
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    log "Sending deployment notification"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ GhostChatApp deployed successfully to $ENVIRONMENT\"}" \
        "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
fi

log "Deployment to $ENVIRONMENT completed successfully!"

# Show deployment summary
log "=== DEPLOYMENT SUMMARY ==="
log "Environment: $ENVIRONMENT"
log "Timestamp: $(date)"
log "Services status:"
docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=running" | while read -r service; do
    log "  ✅ $service: running"
done

# Log any failed services
FAILED_SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=exited")
if [[ -n "$FAILED_SERVICES" ]]; then
    warn "Failed services detected:"
    echo "$FAILED_SERVICES" | while read -r service; do
        warn "  ❌ $service: failed"
    done
fi

log "Deployment script completed"