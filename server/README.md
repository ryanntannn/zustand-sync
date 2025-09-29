# WebSocket Server

A Go-based, lightweight WebSocket server that routes messages by project ID to facilitate syncing state between multiple clients using zustand-sync + WebSocket Transport.

## Quick Start with Docker

### Build the image:

```bash
docker build -t zustand-sync-server:latest .
```

### Run the container:

```bash
docker run -p 8080:8080 zustand-sync-server:latest
```

## Development

### Prerequisites

- Go 1.21+
- Docker (for containerized deployment)

### Local Development

```bash
go mod download
go run main.go
```

### Message Routing

- Messages sent by clients in `project-a` are only received by other clients in `project-a`
- Each project operates independently
- Projects are created automatically when the first client connects

## Environment Variables

- `PORT`: Server port (default: 8080)
- `STORAGE_PATH`: Path for storing project data (default: ./data)
