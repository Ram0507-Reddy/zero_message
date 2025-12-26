# Build Stage
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o zero-backend main.go

# Production Stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/zero-backend .
EXPOSE 8080
CMD ["./zero-backend"]
