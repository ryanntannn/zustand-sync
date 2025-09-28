# WebSocket Server

A Go-based WebSocket server that routes messages by project ID to facilitate syncing state between multiple clients using Zustand.

## Quick Start with Docker

### Build the image:

```bash
docker build -t websocket-server:latest .
```

### Run the container:

```bash
docker run -p 8080:8080 websocket-server:latest
```

### Access the application:

- Web interface: http://localhost:8080
- WebSocket endpoint: ws://localhost:8080/ws/{projectId}

## Development

### Prerequisites

- Go 1.21+
- Docker (for containerized deployment)

### Local Development

```bash
go mod download
go run main.go
```

### Docker Development

```bash
# Build
docker build -t websocket-server .

# Run with port mapping
docker run -p 8080:8080 websocket-server

# Run in background
docker run -d -p 8080:8080 --name websocket-server websocket-server

# View logs
docker logs websocket-server

# Stop container
docker stop websocket-server
```

## Usage

### WebSocket Connection

Connect to a specific project:

```javascript
const ws = new WebSocket("ws://localhost:8080/ws/my-project-id");
```

### Message Routing

- Messages sent by clients in `project-a` are only received by other clients in `project-a`
- Each project operates independently
- Projects are created automatically when the first client connects

## Docker Image Details

- **Base Image**: Alpine Linux (lightweight)
- **User**: Non-root user `appuser` for security
- **Port**: 8080
- **Health Check**: Built-in HTTP health check on `/`
- **Size**: Optimized multi-stage build for small image size

## Environment Variables

Currently, the server uses default settings. Future versions may support:

- `PORT`: Server port (default: 8080)
- `ALLOWED_ORIGINS`: CORS allowed origins
- `LOG_LEVEL`: Logging verbosity
