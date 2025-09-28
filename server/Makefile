# Makefile for WebSocket Server

.PHONY: build run stop clean logs test docker-build docker-run docker-stop docker-clean help

# Variables
IMAGE_NAME=ryanntannn/zustand-sync-server
CONTAINER_NAME=zustand-sync-server
PORT=8080

# Default target
help:
	@echo "Available targets:"
	@echo "  build        - Build the Go application"
	@echo "  run          - Run the Go application locally"
	@echo "  test         - Run tests (placeholder)"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  docker-stop  - Stop Docker container"
	@echo "  docker-clean - Remove Docker container and image"
	@echo "  compose-up   - Start with docker-compose"
	@echo "  compose-down - Stop docker-compose"
	@echo "  logs         - Show container logs"
	@echo "  clean        - Clean up build artifacts"

# Go application targets
build:
	@echo "Building Go application..."
	go build -o websocket-server .

run:
	@echo "Running Go application..."
	go run main.go

test:
	@echo "Running tests..."
	go test ./...

# Docker targets
docker-build:
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):latest .

docker-run: docker-build
	@echo "Running Docker container..."
	docker run -d -p $(PORT):$(PORT) --name $(CONTAINER_NAME) $(IMAGE_NAME):latest
	@echo "Container started. Access at http://localhost:$(PORT)"

docker-stop:
	@echo "Stopping Docker container..."
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

docker-clean: docker-stop
	@echo "Cleaning up Docker resources..."
	-docker rmi $(IMAGE_NAME):latest

# Docker Compose targets
compose-up:
	@echo "Starting with docker-compose..."
	docker-compose up -d
	@echo "Services started. Access at http://localhost:$(PORT)"

compose-down:
	@echo "Stopping docker-compose..."
	docker-compose down

# Utility targets
logs:
	@echo "Showing container logs..."
	docker logs -f $(CONTAINER_NAME)

clean:
	@echo "Cleaning up..."
	-rm -f websocket-server
	go clean

# Development workflow
dev: docker-stop docker-run logs

# Production deployment
deploy: docker-build
	@echo "Deploying to production..."
	@echo "Remember to set proper environment variables and security settings!"
	docker push $(IMAGE_NAME):latest