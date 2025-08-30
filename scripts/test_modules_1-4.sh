#!/bin/bash
# Test script for Modules 1-4 functionality

set -e

echo "🧪 Testing GhostChatApp Modules 1-4"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if Docker is running
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
print_status 0 "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed${NC}"
    exit 1
fi
print_status 0 "docker-compose is available"

# Navigate to project root
cd "$(dirname "$0")/.."

# Stop any existing containers
print_info "Stopping existing containers..."
docker-compose down > /dev/null 2>&1 || true

# Start services
print_info "Starting services..."
docker-compose up -d --build

# Wait for services to be healthy
print_info "Waiting for services to start..."
sleep 10

# Test Module 1: Infrastructure & Setup
echo -e "\n${YELLOW}📋 Module 1: Infrastructure & Setup${NC}"

# Check if database is running
print_info "Testing database connection..."
DB_HEALTH=$(docker-compose exec -T db pg_isready -U chatuser -d chatapp 2>/dev/null && echo "healthy" || echo "unhealthy")
if [ "$DB_HEALTH" = "healthy" ]; then
    print_status 0 "Database is running"
else
    print_status 1 "Database is not healthy"
fi

# Check if Redis is running  
print_info "Testing Redis connection..."
REDIS_HEALTH=$(docker-compose exec -T redis redis-cli -a redispass ping 2>/dev/null || echo "FAILED")
if [ "$REDIS_HEALTH" = "PONG" ]; then
    print_status 0 "Redis is running"
else
    print_status 1 "Redis is not healthy"
fi

# Test backend API health
print_info "Testing backend API..."
sleep 5  # Give backend more time to start
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    print_status 0 "Backend API is responding"
else
    print_status 1 "Backend API is not healthy (HTTP $BACKEND_HEALTH)"
fi

# Test frontend
print_info "Testing frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    print_status 0 "Frontend is running"
else
    print_status 1 "Frontend is not healthy (HTTP $FRONTEND_HEALTH)"
fi

# Test Module 2: Authentication System
echo -e "\n${YELLOW}👤 Module 2: Authentication System${NC}"

# Test user registration
print_info "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname": "testuser", "age_verified": true, "preferences": {"interests": ["testing"]}}')

if echo "$REGISTER_RESPONSE" | grep -q "User registered successfully"; then
    print_status 0 "User registration works"
    
    # Extract token for further tests
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('access_token', ''))
except:
    pass
")
    
    if [ -n "$ACCESS_TOKEN" ]; then
        print_status 0 "JWT token generated"
        
        # Test token validation
        print_info "Testing token validation..."
        ME_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/auth/me \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        
        if echo "$ME_RESPONSE" | grep -q "anonymous_id"; then
            print_status 0 "Token validation works"
        else
            print_status 1 "Token validation failed"
        fi
    else
        print_status 1 "JWT token not generated"
    fi
else
    print_status 1 "User registration failed"
    echo "Response: $REGISTER_RESPONSE"
fi

# Test Module 3: WebSocket/Socket.IO
echo -e "\n${YELLOW}🔌 Module 3: Real-time Communication${NC}"

# Check if Socket.IO endpoint is accessible
print_info "Testing Socket.IO endpoint..."
SOCKETIO_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/socket.io/)
if [ "$SOCKETIO_HEALTH" = "200" ] || [ "$SOCKETIO_HEALTH" = "400" ]; then
    print_status 0 "Socket.IO endpoint is accessible"
else
    print_status 1 "Socket.IO endpoint not accessible (HTTP $SOCKETIO_HEALTH)"
fi

# Test Module 4: Chat System  
echo -e "\n${YELLOW}💬 Module 4: Chat System${NC}"

if [ -n "$ACCESS_TOKEN" ]; then
    # Test room creation
    print_info "Testing room creation..."
    ROOM_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/chat/rooms \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d '{"room_type": "private", "name": "Test Room"}')
    
    if echo "$ROOM_RESPONSE" | grep -q "Room created successfully"; then
        print_status 0 "Room creation works"
        
        # Test getting user rooms
        print_info "Testing room listing..."
        ROOMS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/chat/rooms \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        
        if echo "$ROOMS_RESPONSE" | grep -q "Test Room" || echo "$ROOMS_RESPONSE" | grep -q "\[\]"; then
            print_status 0 "Room listing works"
        else
            print_status 1 "Room listing failed"
        fi
    else
        print_status 1 "Room creation failed"
        echo "Response: $ROOM_RESPONSE"
    fi
    
    # Test matching system
    echo -e "\n${YELLOW}🎯 Module 5: Matching System${NC}"
    print_info "Testing user matching..."
    MATCH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/matching/find \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d '{"age_range": [20, 30], "interests": ["testing"], "language": "en"}')
    
    if echo "$MATCH_RESPONSE" | grep -q "searching"; then
        print_status 0 "Matching system works (searching status)"
    else
        print_status 1 "Matching system failed"
        echo "Response: $MATCH_RESPONSE"
    fi
else
    print_status 1 "Cannot test chat system without valid token"
fi

# Final summary
echo -e "\n${GREEN}🎉 Module Testing Complete!${NC}"
echo "=================================="
echo -e "${GREEN}✅ Module 1: Infrastructure & Setup - WORKING${NC}"
echo -e "${GREEN}✅ Module 2: Authentication System - WORKING${NC}" 
echo -e "${GREEN}✅ Module 3: Real-time Communication - WORKING${NC}"
echo -e "${GREEN}✅ Module 4: Chat System - WORKING${NC}"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Access frontend at: http://localhost:3000"
echo "2. Access backend API docs at: http://localhost:8000/docs"
echo "3. Check logs: docker-compose logs -f"
echo "4. Stop services: docker-compose down"

echo -e "\n${GREEN}🚀 Modules 1-4 are ready for development!${NC}"