#!/bin/bash

# AutoJobr Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
DOMAIN=""
EMAIL=""
SKIP_SSL=false
BUILD_ONLY=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (production, staging, development)"
    echo "  -d, --domain DOMAIN      Domain name for the application"
    echo "  -m, --email EMAIL        Email for Let's Encrypt certificates"
    echo "  -s, --skip-ssl           Skip SSL certificate generation"
    echo "  -b, --build-only         Only build the application, don't deploy"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production -d example.com -m admin@example.com"
    echo "  $0 -e staging -d staging.example.com -m admin@example.com -s"
    echo "  $0 -b"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -m|--email)
            EMAIL="$2"
            shift 2
            ;;
        -s|--skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    print_error "Invalid environment. Must be one of: production, staging, development"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Starting AutoJobr deployment for $ENVIRONMENT environment"

# Create necessary directories
print_status "Creating deployment directories..."
mkdir -p logs uploads ssl letsencrypt monitoring/grafana/provisioning

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    print_warning "Environment file $ENV_FILE not found. Creating from template..."
    if [[ -f ".env.docker" ]]; then
        cp .env.docker "$ENV_FILE"
        print_warning "Please edit $ENV_FILE and fill in your configuration values"
        read -p "Press Enter to continue after editing the file..."
    else
        print_error "Template file .env.docker not found. Please create $ENV_FILE manually."
        exit 1
    fi
fi

# Validate required environment variables
print_status "Validating environment configuration..."
source "$ENV_FILE"

required_vars=(
    "POSTGRES_PASSWORD"
    "GROQ_API_KEY"
    "STRIPE_SECRET_KEY"
    "RESEND_API_KEY"
    "NEXTAUTH_SECRET"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        print_error "Required environment variable $var is not set in $ENV_FILE"
        exit 1
    fi
done

# Build the application
print_status "Building Docker image..."
docker build -t autojobr:latest . || {
    print_error "Failed to build Docker image"
    exit 1
}

if [[ "$BUILD_ONLY" == true ]]; then
    print_status "Build completed successfully!"
    exit 0
fi

# Choose the appropriate Docker Compose file
COMPOSE_FILE="docker-compose.yml"
if [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

print_status "Using Docker Compose file: $COMPOSE_FILE"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true

# Start the application
print_status "Starting AutoJobr application..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for application to be ready
print_status "Waiting for application to be ready..."
timeout=60
counter=0
while [[ $counter -lt $timeout ]]; do
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        print_status "Application is ready!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
done

if [[ $counter -ge $timeout ]]; then
    print_error "Application failed to start within $timeout seconds"
    print_error "Check logs with: docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi

# SSL Certificate setup for production
if [[ "$ENVIRONMENT" == "production" ]] && [[ "$SKIP_SSL" == false ]]; then
    if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
        print_warning "Domain and email are required for SSL certificate generation"
        print_warning "Skipping SSL setup. You can set it up later with:"
        print_warning "certbot --nginx -d your-domain.com"
    else
        print_status "Setting up SSL certificate for $DOMAIN..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            print_status "Installing certbot..."
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot python3-certbot-nginx
            elif command -v yum &> /dev/null; then
                sudo yum install -y certbot python3-certbot-nginx
            else
                print_warning "Could not install certbot automatically. Please install it manually."
            fi
        fi
        
        # Generate SSL certificate
        if command -v certbot &> /dev/null; then
            sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive || {
                print_warning "SSL certificate generation failed. You can set it up later manually."
            }
        fi
    fi
fi

# Show deployment information
print_status "Deployment completed successfully!"
echo ""
echo "Application Information:"
echo "  Environment: $ENVIRONMENT"
echo "  Local URL: http://localhost:5000"
if [[ -n "$DOMAIN" ]]; then
    echo "  Domain URL: http://$DOMAIN"
fi
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop application: docker-compose -f $COMPOSE_FILE down"
echo "  Restart application: docker-compose -f $COMPOSE_FILE restart"
echo "  View running containers: docker-compose -f $COMPOSE_FILE ps"
echo ""

# Show monitoring URLs if enabled
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "Monitoring URLs:"
    echo "  Grafana: http://localhost:3000 (admin / check GRAFANA_PASSWORD in $ENV_FILE)"
    echo "  Prometheus: http://localhost:9090"
    echo ""
fi

# Show next steps
echo "Next steps:"
echo "1. Configure your DNS to point to this server"
echo "2. Test the application functionality"
echo "3. Set up regular backups"
echo "4. Configure monitoring alerts"
echo "5. Review security settings"

print_status "AutoJobr deployment completed successfully!"