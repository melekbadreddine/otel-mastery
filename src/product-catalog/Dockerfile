# Build stage.
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Install git (required for go modules) and other dependencies.
RUN apk add --no-cache git

# Copy go.mod and go.sum files and download dependencies.
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code.
COPY . .

# Build the Go binary.
RUN CGO_ENABLED=0 GOOS=linux go build -o product-catalog .

# Final stage.
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary from the builder stage.
COPY --from=builder /app/product-catalog .

# Expose the port the service runs on.
EXPOSE 3001

# Run the binary.
CMD ["./product-catalog"]

