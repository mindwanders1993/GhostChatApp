#!/bin/bash

# GhostChatApp Backup Script
# Usage: ./scripts/backup.sh [--upload-s3]

set -euo pipefail

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/ghostchatapp-backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting backup process"

# Database backup
log "Creating database backup"
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

if docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U chatuser -d chatapp > "$DB_BACKUP_FILE"; then
    log "Database backup created: $DB_BACKUP_FILE"
    
    # Compress the backup
    if gzip "$DB_BACKUP_FILE"; then
        DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"
        log "Database backup compressed: $DB_BACKUP_FILE"
        
        # Get file size
        BACKUP_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
    else
        error "Failed to compress database backup"
    fi
else
    error "Database backup failed"
fi

# Redis backup (if needed)
log "Creating Redis backup"
REDIS_BACKUP_FILE="$BACKUP_DIR/redis_backup_$DATE.rdb"

if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb /data/dump.rdb; then
    if docker cp "$(docker-compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb" "$REDIS_BACKUP_FILE"; then
        log "Redis backup created: $REDIS_BACKUP_FILE"
        gzip "$REDIS_BACKUP_FILE"
        log "Redis backup compressed: ${REDIS_BACKUP_FILE}.gz"
    else
        warn "Failed to copy Redis backup file"
    fi
else
    warn "Redis backup failed - continuing with database backup only"
fi

# Configuration backup
log "Creating configuration backup"
CONFIG_BACKUP_FILE="$BACKUP_DIR/config_backup_$DATE.tar.gz"

tar -czf "$CONFIG_BACKUP_FILE" \
    --exclude='logs/*' \
    --exclude='node_modules/*' \
    --exclude='venv/*' \
    --exclude='.git/*' \
    --exclude='*.pyc' \
    --exclude='__pycache__/*' \
    docker-compose*.yml \
    .env.prod \
    nginx*.conf \
    monitoring/ \
    scripts/ || warn "Some configuration files may be missing"

log "Configuration backup created: $CONFIG_BACKUP_FILE"

# Upload to S3 if requested
if [[ "${1:-}" == "--upload-s3" ]]; then
    if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]] || [[ -z "${S3_BUCKET:-}" ]]; then
        error "AWS credentials or S3_BUCKET not configured"
    fi
    
    log "Uploading backups to S3"
    
    # Upload database backup
    if aws s3 cp "$DB_BACKUP_FILE" "s3://$S3_BUCKET/database/$(basename "$DB_BACKUP_FILE")"; then
        log "Database backup uploaded to S3"
    else
        error "Failed to upload database backup to S3"
    fi
    
    # Upload Redis backup if it exists
    if [[ -f "${REDIS_BACKUP_FILE}.gz" ]]; then
        if aws s3 cp "${REDIS_BACKUP_FILE}.gz" "s3://$S3_BUCKET/redis/$(basename "${REDIS_BACKUP_FILE}.gz")"; then
            log "Redis backup uploaded to S3"
        else
            warn "Failed to upload Redis backup to S3"
        fi
    fi
    
    # Upload configuration backup
    if aws s3 cp "$CONFIG_BACKUP_FILE" "s3://$S3_BUCKET/config/$(basename "$CONFIG_BACKUP_FILE")"; then
        log "Configuration backup uploaded to S3"
    else
        warn "Failed to upload configuration backup to S3"
    fi
    
    # Set lifecycle policy to delete old backups
    log "Setting S3 lifecycle policy for old backups"
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "$S3_BUCKET" \
        --lifecycle-configuration file://s3-lifecycle-policy.json || warn "Failed to set S3 lifecycle policy"
fi

# Cleanup old local backups (keep last 7 days)
log "Cleaning up old local backups"
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -mtime +7 -delete

# Backup verification
log "Verifying backup integrity"

if [[ -f "$DB_BACKUP_FILE" ]]; then
    # Test if the gzipped file is valid
    if gzip -t "$DB_BACKUP_FILE"; then
        log "Database backup integrity check passed"
    else
        error "Database backup integrity check failed"
    fi
else
    error "Database backup file not found"
fi

# Generate backup report
REPORT_FILE="$BACKUP_DIR/backup_report_$DATE.txt"
cat > "$REPORT_FILE" << EOF
GhostChatApp Backup Report
==========================
Date: $(date)
Database Backup: $(basename "$DB_BACKUP_FILE")
Database Size: $(du -h "$DB_BACKUP_FILE" 2>/dev/null | cut -f1 || echo "Unknown")
Redis Backup: $(basename "${REDIS_BACKUP_FILE}.gz" 2>/dev/null || echo "Not created")
Config Backup: $(basename "$CONFIG_BACKUP_FILE")
Config Size: $(du -h "$CONFIG_BACKUP_FILE" 2>/dev/null | cut -f1 || echo "Unknown")
S3 Upload: ${1:-"No"}
Status: Success
EOF

log "Backup report generated: $REPORT_FILE"

# Send notification if webhook configured
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    log "Sending backup notification"
    
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"📦 GhostChatApp backup completed successfully\\nTotal size: $TOTAL_SIZE\\nS3 upload: ${1:-No}\"}" \
        "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
fi

log "Backup process completed successfully"

# Show backup summary
log "=== BACKUP SUMMARY ==="
log "Date: $(date)"
log "Database backup: $DB_BACKUP_FILE"
log "Configuration backup: $CONFIG_BACKUP_FILE"
if [[ -f "${REDIS_BACKUP_FILE}.gz" ]]; then
    log "Redis backup: ${REDIS_BACKUP_FILE}.gz"
fi
log "S3 upload: ${1:-No}"
log "Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"