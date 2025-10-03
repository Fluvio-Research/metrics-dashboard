# Grafana Development Environment

This is a **true development environment** for Grafana where you can modify source code and see changes immediately.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Yarn
- Go (v1.21+)
- Git

### Setup Commands

1. **Build Grafana:**
   ```bash
   ./dev.sh build
   ```

2. **Start Development Server:**
   ```bash
   ./dev.sh start
   ```

3. **Access Grafana:**
   - URL: http://localhost:3000
   - Username: `admin`
   - Password: `admin`

## 📋 Available Commands

The `dev.sh` script provides easy management of your Grafana development environment:

### Core Commands
- `./dev.sh build` - Build Grafana (backend + frontend)
- `./dev.sh start` - Start Grafana development server
- `./dev.sh stop` - Stop Grafana development server
- `./dev.sh restart` - Restart Grafana development server
- `./dev.sh status` - Show Grafana status
- `./dev.sh logs` - Show Grafana logs (follow mode)

### Development Commands
- `./dev.sh clean` - Clean build artifacts
- `./dev.sh deps` - Install dependencies
- `./dev.sh test` - Run tests
- `./dev.sh dev` - Start frontend development server

### Help
- `./dev.sh help` - Show all available commands

## 🔧 Development Features

### True Development Mode
- ✅ **Source Code Access:** Full access to Grafana source code
- ✅ **Live Code Changes:** Modify code and see changes immediately
- ✅ **Hot Reload:** Frontend changes reload automatically
- ✅ **Debug Support:** Full debugging capabilities
- ✅ **Version Control:** Git integration for tracking changes

### Development Workflow
1. **Make Code Changes:** Edit files in `pkg/` (backend) or `public/` (frontend)
2. **Auto-Reload:** Frontend changes reload automatically
3. **Restart Backend:** Use `./dev.sh restart` for backend changes
4. **View Logs:** Use `./dev.sh logs` to monitor activity

## 📁 Project Structure

```
grafana-dev/
├── dev.sh              # Development management script
├── conf/dev.ini        # Development configuration
├── data/               # Grafana data directory
├── bin/                # Built binaries
├── pkg/                # Backend source code
├── public/             # Frontend source code
└── packages/           # Grafana packages
```

## 🛠️ Configuration

### Development Configuration (`conf/dev.ini`)
- **Port:** 3000
- **Database:** SQLite (stored in `data/`)
- **Log Level:** Debug
- **Admin:** admin/admin
- **Sign-up:** Enabled for development

### Key Features Enabled
- ✅ Unified Alerting
- ✅ Anonymous access (disabled)
- ✅ Embedding allowed
- ✅ Debug logging
- ✅ Development-friendly settings

## 🔍 Troubleshooting

### Common Issues

**1. "Grafana binary not found"**
```bash
./dev.sh build
```

**2. "Port 3000 already in use"**
```bash
./dev.sh stop
./dev.sh start
```

**3. "Build failed"**
```bash
./dev.sh clean
./dev.sh deps
./dev.sh build
```

**4. "Cannot access Grafana"**
```bash
./dev.sh status
./dev.sh logs
```

### Log Locations
- **Application Logs:** `data/grafana.log`
- **Build Logs:** Console output during build
- **Process PID:** `data/grafana.pid`

## 🧪 Testing

### Run Tests
```bash
./dev.sh test
```

### Frontend Development
```bash
./dev.sh dev
```

## 📊 Monitoring

### Check Status
```bash
./dev.sh status
```

### View Logs
```bash
./dev.sh logs
```

### Process Management
- **PID File:** `data/grafana.pid`
- **Log File:** `data/grafana.log`
- **Data Directory:** `data/`

## 🔄 Development Workflow

### Typical Development Session
1. **Start Environment:**
   ```bash
   ./dev.sh start
   ```

2. **Make Changes:**
   - Edit backend code in `pkg/`
   - Edit frontend code in `public/`
   - Edit configuration in `conf/dev.ini`

3. **Apply Changes:**
   - Frontend: Auto-reloads
   - Backend: `./dev.sh restart`

4. **Monitor:**
   ```bash
   ./dev.sh logs
   ```

5. **Stop Environment:**
   ```bash
   ./dev.sh stop
   ```

## 🚀 Production Build

When ready to deploy, build for production:

```bash
# Clean development artifacts
./dev.sh clean

# Build for production
make build

# The binary will be in bin/darwin-arm64/grafana
```

## 📚 Additional Resources

- [Grafana Developer Guide](https://github.com/grafana/grafana/blob/main/contribute/developer-guide.md)
- [Grafana Documentation](https://grafana.com/docs/)
- [Grafana Community](https://community.grafana.com/)

## 🎯 Version Information

- **Current Version:** Grafana 12.2.0-pre (development)
- **Architecture:** darwin-arm64
- **Mode:** Development
- **Database:** SQLite
- **Port:** 3000

---

**Happy Developing! 🎉** 