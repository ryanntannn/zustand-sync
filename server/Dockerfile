# Multi-stage build for Go WebSocket server
# Stage 1: Build the application
FROM golang:1.23-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Install git (needed for some Go modules)
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
# CGO_ENABLED=0 creates a statically linked binary
# GOOS=linux ensures compatibility
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o websocket-server .

# Stage 2: Create the final lightweight image
FROM alpine:latest

# Install ca-certificates for HTTPS requests (if needed)
RUN apk --no-cache add ca-certificates

# Create a non-root user for security
RUN adduser -D -s /bin/sh appuser

WORKDIR /home/appuser/

# Copy the binary from the builder stage
COPY --from=builder /app/websocket-server .

# Change ownership to appuser
RUN chown appuser:appuser websocket-server

# Switch to non-root user
USER appuser

# Expose port 8080
EXPOSE 8080

# Health check to ensure the server is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Command to run the application
CMD ["./websocket-server"]
