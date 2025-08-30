# GhostChatApp Deployment Guide

This guide covers deploying GhostChatApp to production environments using Docker Compose.

## Prerequisites

- Docker and Docker Compose v2.0+
- Linux server (Ubuntu 20.04+ recommended)
- Domain name with DNS pointing to your server
- SSL certificate (Let's Encrypt recommended)
- At least 4GB RAM and 2 CPU cores
- 50GB+ storage space

## Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd GhostChatApp
```

2. **Configure environment variables:**
```bash
cp .env.prod .env
# Edit .env with your actual values
```

3. **Set up SSL certificates:**
```bash
mkdir -p ssl
# Copy your SSL certificates to ssl/ directory
```

4. **Deploy:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

## Detailed Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create application directory
sudo mkdir -p /opt/ghostchatapp
sudo chown $USER:$USER /opt/ghostchatapp
cd /opt/ghostchatapp

# Clone repository
git clone <repository-url> .
```

### 2. Environment Configuration

Create and configure your environment file:

```bash
cp .env.prod .env
```

Essential variables to configure:

```bash
# Security (CRITICAL - Change these!)
SECRET_KEY=your-super-secure-jwt-key-at-least-32-characters-long
DB_PASSWORD=your-secure-database-password
REDIS_PASSWORD=your-secure-redis-password

# Domain configuration
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com

# AWS (for image moderation)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Optional: Content moderation service
MODERATION_API_KEY=your-moderation-api-key

# Monitoring
GRAFANA_PASSWORD=your-grafana-password

# Backup
BACKUP_S3_BUCKET=your-backup-bucket
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Obtain certificates
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/chain.pem ssl/chain.pem
sudo chown $USER:$USER ssl/*
```

#### Option B: Custom Certificates

```bash
# Copy your certificates to ssl/ directory
cp your-cert.pem ssl/cert.pem
cp your-private-key.pem ssl/key.pem
cp your-chain.pem ssl/chain.pem
```

### 4. Database Initialization

The database will be automatically initialized on first run. The init script will:
- Create necessary extensions
- Set up indexes for performance
- Create stored functions for cleanup

### 5. Deployment

Run the deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

The script will:
- Pull latest code
- Create database backup
- Build and start containers
- Run health checks
- Clean up old resources

### 6. Verification

Check that all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Test the application:

```bash
# Frontend
curl -I https://yourdomain.com

# Backend API
curl -I https://api.yourdomain.com/health

# WebSocket (optional)
wscat -c wss://api.yourdomain.com/ws/test-user
```

## Monitoring

Access monitoring dashboards:

- **Grafana**: http://yourserver:3001 (admin/[GRAFANA_PASSWORD])
- **Prometheus**: http://yourserver:9090
- **Kibana**: http://yourserver:5601

## Backup and Recovery

### Automated Backups

Set up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/ghostchatapp/scripts/backup.sh --upload-s3 >> /var/log/backup.log 2>&1
```

### Manual Backup

```bash
./scripts/backup.sh --upload-s3
```

### Recovery

1. **Database Recovery:**
```bash
# Stop services
docker-compose -f docker-compose.prod.yml stop

# Restore database
gunzip -c /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker-compose -f docker-compose.prod.yml exec -T db psql -U chatuser -d chatapp

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo ufw --force enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Block all other ports (monitoring ports are bound to localhost only)
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 2. System Security

```bash
# Disable root login
sudo passwd -l root

# Update regularly
echo '0 4 * * * apt update && apt upgrade -y' | sudo crontab -

# Install fail2ban
sudo apt install fail2ban
```

### 3. Application Security

- Change all default passwords in `.env`
- Use strong JWT secret key (32+ characters)
- Enable rate limiting (configured by default)
- Regular security updates via CI/CD

## Scaling

### Horizontal Scaling

1. **Database Read Replicas:**
```yaml
db-replica:
  image: postgres:15-alpine
  environment:
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  command: postgres -c wal_level=replica
```

2. **Load Balancer:**
Add multiple backend instances and configure nginx upstream.

3. **Redis Cluster:**
For high availability, set up Redis cluster mode.

### Vertical Scaling

Adjust resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

## Troubleshooting

### Common Issues

1. **Services won't start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check system resources
df -h
free -h
```

2. **Database connection errors:**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready -U chatuser

# Reset database password
docker-compose -f docker-compose.prod.yml exec db psql -U chatuser -c "ALTER USER chatuser WITH PASSWORD 'newpassword';"
```

3. **SSL certificate issues:**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Renew Let's Encrypt certificates
sudo certbot renew
```

### Performance Issues

1. **Database performance:**
```bash
# Check slow queries
docker-compose -f docker-compose.prod.yml exec db psql -U chatuser -d chatapp -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

2. **Memory usage:**
```bash
# Check container memory usage
docker stats

# Adjust resource limits if needed
```

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Review logs for errors
   - Check disk space usage
   - Verify backups are working

2. **Monthly:**
   - Update system packages
   - Review security logs
   - Clean up old Docker images

3. **Quarterly:**
   - Review and rotate secrets
   - Update SSL certificates
   - Performance review and optimization

### Updates

To update the application:

```bash
# Pull latest changes
git pull origin main

# Deploy updates
./scripts/deploy.sh production
```

## Support

For deployment issues:
1. Check the logs: `docker-compose logs`
2. Review this documentation
3. Check GitHub issues
4. Contact the development team

## Security Contact

For security-related issues, please contact: security@yourdomain.com