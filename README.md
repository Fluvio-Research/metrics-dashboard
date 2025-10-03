# Grafana Development Environment

This repository provides multiple ways to set up Grafana for development and testing purposes.

## 🚀 Quick Start Options

### Option 1: Docker (Recommended for testing)

**Prerequisites:**
- Docker and Docker Compose installed
- Port 3000 available on your machine

**Setup Instructions:**

1. **Start Grafana:**
   ```bash
   docker-compose up -d
   ```

2. **Access Grafana:**
   - Open your browser and go to: http://localhost:3000
   - Login with:
     - Username: `admin`
     - Password: `admin`

3. **Stop Grafana:**
   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f grafana
   ```

#### Building Docker Image from Source

To build a custom Docker image from the Grafana source code:

```bash
# Navigate to grafana-dev directory
cd grafana-dev

# Build for your platform (linux/amd64, linux/arm64, etc.)
docker build --target final -t grafana-custom .

# Or build with specific build arguments
docker build \
  --target final \
  --build-arg GO_BUILD_TAGS="oss" \
  --build-arg COMMIT_SHA="$(git rev-parse HEAD)" \
  --build-arg BUILD_BRANCH="$(git branch --show-current)" \
  -t grafana-custom .

# Run your custom image
docker run -d -p 3000:3000 --name grafana-custom grafana-custom
```

**Common Build Arguments:**
- `GO_BUILD_TAGS`: Build tags (default: "oss")
- `COMMIT_SHA`: Git commit hash for version info
- `BUILD_BRANCH`: Git branch name for version info
- `GF_UID`: Grafana user ID (default: 472)
- `GF_GID`: Grafana group ID (default: 0)

### Option 2: Development Environment (For contributors)

**Prerequisites:**
- Go (1.21+), Node.js (22.x), Yarn (4.9.2+), Make, Git

**Setup Instructions:**

1. **Install dependencies and build:**
   ```bash
   ./dev.sh deps
   ./dev.sh build
   ```

2. **Start development server:**
   ```bash
   ./dev.sh start
   ```

3. **Access Grafana:**
   - URL: http://localhost:3000
   - Credentials: admin/admin

4. **Development workflow:**
   ```bash
   # Start frontend dev server with hot reload
   ./dev.sh dev

   # View logs
   ./dev.sh logs

   # Run tests
   ./dev.sh test
   ```

📖 **[Detailed Development Guide →](DEVELOPMENT-README.md)**

## Configuration

### Docker Setup
- **Port:** 3000
- **Database:** SQLite (stored in Docker volume)
- **Admin credentials:** admin/admin
- **Sign-up disabled:** For security in development
- **Unified Alerting:** Enabled

### Development Setup
- **Backend:** Built from source in `grafana-dev/`
- **Frontend:** Webpack dev server with hot reload
- **Database:** SQLite in `data/grafana.db`
- **Configuration:** `grafana-dev/conf/dev.ini`

## Development Features

### Docker Environment
- Persistent storage using Docker volumes
- Custom configuration via `grafana.ini`
- Latest Grafana Community Edition
- Easy to start/stop/restart

### Development Environment
- Full source code access for contributions
- Hot reload for frontend changes
- Backend debugging capabilities
- Comprehensive test suite
- Plugin development support

## Data Sources

After starting Grafana, you can add data sources through the web interface:
1. Go to Configuration → Data Sources
2. Add your preferred data sources (Prometheus, InfluxDB, etc.)

## Plugins

### Docker Installation
To install additional plugins:

1. **Using pre-built image:**
   - Use the Grafana web interface (Configuration → Plugins)
   - Or modify the Docker Compose file to include plugin installation

2. **When building custom Docker image:**
   ```bash
   # Copy your custom plugins to the plugins directory
   mkdir -p packaging/docker/custom/plugins
   # Add your plugins...

   # Build with plugins included
   docker build \
     --target final \
     -t grafana-with-plugins \
     --build-arg GF_INSTALL_PLUGINS="plugin1,plugin2" \
     .
   ```

### Development Environment
Plugin development is supported with:
- Build system for custom plugins
- Hot reload during development
- Access to all Grafana packages

## Troubleshooting

### Docker Issues
- If port 3000 is in use, modify the port mapping in `docker-compose.yml`
- Check logs with `docker-compose logs grafana`
- Reset data by running `docker-compose down -v` (this will delete all data)

### Docker Build Issues
- **Build fails on ARM64:** Use `JS_PLATFORM=linux/arm64` build argument
- **Out of memory:** Increase Docker memory limit or use `--memory` flag
- **Slow builds:** Enable BuildKit with `DOCKER_BUILDKIT=1` environment variable
- **Missing dependencies:** Ensure all build dependencies are installed (Go, Node.js, Make)

### Development Issues
- Check the [detailed development guide](DEVELOPMENT-README.md)
- View logs: `./dev.sh logs`
- Check status: `./dev.sh status`
- Clean and rebuild: `./dev.sh clean && ./dev.sh deps && ./dev.sh build`

## Getting Help

- **Development Guide:** [DEVELOPMENT-README.md](DEVELOPMENT-README.md)
- **Docker Issues:** Check Docker logs and container status
- **Development Issues:** Use `./dev.sh logs` for detailed error information
- **Community:** [Grafana Community Forums](https://community.grafana.com/) 