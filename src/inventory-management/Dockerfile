# Build stage: use Go 1.21 Alpine image
FROM golang:1.21-alpine AS builder
WORKDIR /app
# Copy go.mod and go.sum and download dependencies
COPY go.mod go.sum ./
RUN go mod download
# Copy the source code and build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o inventory-management .

# Run stage: use a minimal Alpine image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/inventory-management .
EXPOSE 3004
CMD ["./inventory-management"]

