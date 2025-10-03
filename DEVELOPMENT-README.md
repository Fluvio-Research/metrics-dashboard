# Grafana Development Environment

This guide covers setting up and managing the Grafana development environment using the `dev.sh` script and building Grafana from source.

## Prerequisites

- **Go** (version 1.21 or later)
- **Node.js** (version 22.x)
- **Yarn** (version 4.9.2 or compatible)
- **Make** (for build automation)
- **Git** (for cloning repositories)

## Quick Start

### 1. Setup Development Environment

```bash
# Install dependencies
./dev.sh deps

# Build Grafana (backend + frontend)
./dev.sh build

# Start Grafana development server
./dev.sh start
```

### 2. Access Grafana

- **URL:** http://localhost:3000
- **Username:** `admin`
- **Password:** `admin`

### 3. Development Workflow

```bash
# Start development server with hot reload
./dev.sh dev

# Run tests
./dev.sh test

# View logs
./dev.sh logs

# Restart server
./dev.sh restart
```

## Development Commands

The `dev.sh` script provides the following commands:

### Core Commands

| Command | Description |
|---------|-------------|
| `build` | Build Grafana backend and frontend from source |
| `start` | Start the Grafana development server |
| `stop` | Stop the Grafana development server |
| `restart` | Restart the Grafana development server |
| `status` | Show current Grafana server status |
| `logs` | View Grafana logs in real-time (Ctrl+C to exit) |

### Development Commands

| Command | Description |
|---------|-------------|
| `dev` | Start frontend development server with hot reload |
| `deps` | Install all required dependencies |
| `clean` | Clean build artifacts and cache |
| `test` | Run test suite |

### Utility Commands

| Command | Description |
|---------|-------------|
| `help` | Show all available commands and usage |

## Building Grafana

### Full Build Process

```bash
# 1. Install dependencies
./dev.sh deps

# 2. Build both backend and frontend
./dev.sh build
```

This process will:
- Compile Go backend code
- Install Node.js dependencies
- Build frontend assets using Webpack
- Generate necessary build artifacts

### Frontend Only Build

For frontend development, you can use yarn directly:

```bash
# Navigate to grafana-dev directory
cd grafana-dev

# Install frontend dependencies
yarn install

# Build frontend for production
yarn build

# Build frontend without minification (faster)
yarn build:nominify

# Start development server with hot reload
yarn dev

# Run frontend tests
yarn test
```

### Backend Only Build

The backend is built automatically when running `./dev.sh build`, but you can also build it manually:

```bash
cd grafana-dev
make build-go
```

## Development Workflow

### 1. Setting Up for Development

```bash
# Clone and setup (if not already done)
git clone https://github.com/grafana/grafana.git grafana-dev
cd grafana-dev

# Install all dependencies
../dev.sh deps

# Build the project
../dev.sh build
```

### 2. Starting Development Servers

#### Option A: Full Development Server
```bash
# Start both backend and frontend servers
./dev.sh start

# In another terminal, start frontend dev server with hot reload
./dev.sh dev
```

#### Option B: Frontend Development Only
```bash
cd grafana-dev

# Start webpack dev server (includes backend API proxy)
yarn start
```

### 3. Making Changes

#### Frontend Changes
- Edit files in `public/app/`
- Changes are automatically reflected with hot reload
- For production builds, run `yarn build`

#### Backend Changes
- Edit files in `pkg/`
- Restart the server: `./dev.sh restart`
- Or build and restart: `./dev.sh build && ./dev.sh start`

### 4. Testing

```bash
# Run all tests
./dev.sh test

# Run specific test suites
cd grafana-dev
yarn test -- --testPathPattern=panels
```

## Configuration

### Environment Variables

The development server supports various environment variables:

```bash
# AWS Configuration (if using AWS features)
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"

# Start server with AWS credentials
./dev.sh start
```

### Grafana Configuration

Configuration is managed through `conf/dev.ini`. Common settings:

```ini
[server]
# Server settings
http_port = 3000
root_url = http://localhost:3000

[database]
# Database configuration
type = sqlite3
path = data/grafana.db

[session]
# Session configuration
provider = file
provider_config = sessions
```

## Troubleshooting

### Common Issues

#### Port 3000 Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Stop the conflicting process or change the port in conf/dev.ini
```

#### Build Failures
```bash
# Clean build artifacts and rebuild
./dev.sh clean
./dev.sh deps
./dev.sh build
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be 22.x - update if necessary
```

#### Go Module Issues
```bash
cd grafana-dev
go mod tidy
go mod download
```

### Logs and Debugging

```bash
# View real-time logs
./dev.sh logs

# Check server status
./dev.sh status

# Manual log viewing
tail -f data/grafana.log
```

## Advanced Development

### Working with Plugins

1. **Install Plugin Dependencies**
```bash
# Install frontend dependencies for all packages
cd grafana-dev
yarn packages:build
```

2. **Build Specific Packages**
```bash
# Build a specific package
yarn workspace @grafana/ui build

# Build all packages
yarn packages:build
```

### Database Management

```bash
# Reset database (removes all data)
rm -f data/grafana.db

# Start fresh
./dev.sh start
```

### Performance Optimization

```bash
# Build without minification for faster builds during development
cd grafana-dev
yarn build:nominify

# Use development webpack config for faster rebuilds
yarn dev
```

## Production Build

For production deployments:

```bash
cd grafana-dev

# Production build with minification
yarn build

# Build backend for production
make build-go

# The binaries will be in bin/darwin-arm64/ (or appropriate platform)
```

## Integration with Docker

You can also run Grafana using Docker while developing:

```bash
# Build your changes
./dev.sh build

# Use Docker Compose for production-like environment
docker-compose up -d
```

## Getting Help

```bash
# Show all available commands
./dev.sh help

# View this documentation
cat DEVELOPMENT-README.md

# Grafana community resources
# - https://community.grafana.com/
# - https://grafana.com/docs/grafana/latest/
```
