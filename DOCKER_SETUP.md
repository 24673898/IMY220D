# Docker Setup Guide

## Overview
This application uses Docker to containerize the application. User-uploaded images (profile pictures and project covers) are persisted using Docker volumes.

## Docker Volumes

### Uploads Volume
The `uploads-data` volume persists all user-uploaded files across container restarts:
- Profile images: `/app/backend/uploads/profile-images/`
- Project images: `/app/backend/uploads/project-images/`

## Getting Started

### 1. Build and Start the Container
```bash
docker-compose up -d --build
```

### 2. Stop the Container
```bash
docker-compose down
```

### 3. Restart the Container (uploads will persist)
```bash
docker-compose restart
```

## Managing Uploads

### View Uploaded Files
```bash
# Access the container
docker-compose exec app sh

# List profile images
ls -la /app/backend/uploads/profile-images/

# List project images
ls -la /app/backend/uploads/project-images/
```

### Backup Uploads
```bash
# Create a backup of all uploads
docker cp $(docker-compose ps -q app):/app/backend/uploads ./uploads-backup

# Or backup the volume directly
docker run --rm -v uploads-data:/source -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /source .
```

### Restore Uploads
```bash
# Restore from backup
docker cp ./uploads-backup/. $(docker-compose ps -q app):/app/backend/uploads/

# Or restore from volume backup
docker run --rm -v uploads-data:/target -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /target
```

### Clear All Uploads (Fresh Start)
```bash
# Stop containers
docker-compose down

# Remove the volume
docker volume rm imy220d_uploads-data

# Start fresh
docker-compose up -d --build
```

## Troubleshooting

### Images Not Showing After Restart
If images don't appear after restarting:
1. Check if the volume is mounted: `docker-compose config`
2. Verify files exist in the volume: `docker-compose exec app ls -la /app/backend/uploads/`
3. Check database has correct image paths (should start with `/uploads/`)

### Permission Issues
If you encounter permission errors:
```bash
# Fix permissions inside container
docker-compose exec app chown -R node:node /app/backend/uploads/
```

## Production Deployment

For production, consider:
1. Using a dedicated file storage service (AWS S3, Google Cloud Storage, etc.)
2. Regular backups of the uploads volume
3. Monitoring disk space usage

## Volume Information

- **Volume Name**: `imy220d_uploads-data` (may vary based on project directory name)
- **Mount Point**: `/app/backend/uploads`
- **Driver**: local
- **Persistence**: Data persists across container restarts and rebuilds
