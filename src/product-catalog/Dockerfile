# Build stage: use Go 1.22 Alpine image
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code and build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o product-catalog .

# Run stage: use a minimal Alpine image
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/product-catalog .

EXPOSE 3001
CMD ["./product-catalog"]
