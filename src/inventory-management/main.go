package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"

	// Prometheus client for metrics.
	"github.com/prometheus/client_golang/prometheus/promhttp"

	// Logrus for structured logging.
	"github.com/sirupsen/logrus"
)

// InventoryItem represents an inventory record.
type InventoryItem struct {
	ID        int    `json:"id"`
	ProductID string `json:"productId"`
	Stock     int    `json:"stock"`
}

// OrderConfirmation represents the payload received from Kafka.
type OrderConfirmation struct {
	OrderNumber   string      `json:"orderNumber"`
	Items         []OrderItem `json:"items"`
	CheckoutTime  time.Time   `json:"checkoutTime"`
	OrderStatus   string      `json:"orderStatus"`
	PaymentStatus string      `json:"paymentStatus"`
}

// OrderItem represents an individual item in an order.
type OrderItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}

var db *sql.DB

// Global logger instance using logrus.
var logger = logrus.New()

func main() {
	// Configure logger.
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	// Load configuration from environment variables.
	port := os.Getenv("PORT")
	if port == "" {
		port = "3004"
	}
	postgresURL := os.Getenv("POSTGRES_URL")
	if postgresURL == "" {
		// Default connection string (should not be used in production).
		postgresURL = "postgres://postgres:postgres@postgres:5432/inventorydb?sslmode=disable"
	}
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "kafka:9092"
	}
	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	if kafkaTopic == "" {
		kafkaTopic = "order-confirmation"
	}

	// Connect to PostgreSQL with a retry loop.
	var err error
	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		db, err = sql.Open("postgres", postgresURL)
		if err != nil {
			logger.Errorf("Attempt %d: Failed to open PostgreSQL connection: %v", i+1, err)
			time.Sleep(5 * time.Second)
			continue
		}
		err = db.Ping()
		if err != nil {
			logger.Errorf("Attempt %d: Failed to ping PostgreSQL: %v", i+1, err)
			time.Sleep(5 * time.Second)
			continue
		}
		logger.Infof("Connected to PostgreSQL on attempt %d", i+1)
		break
	}
	if err != nil {
		logger.Fatalf("Failed to connect to PostgreSQL after %d attempts: %v", maxRetries, err)
	}
	defer db.Close()

	// Create the inventory table if it does not exist.
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS inventory (
		id SERIAL PRIMARY KEY,
		product_id VARCHAR(255) UNIQUE NOT NULL,
		stock INTEGER NOT NULL
	);
	`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		logger.Fatalf("Failed to create inventory table: %v", err)
	}

	// Start Kafka consumer for order confirmation events.
	go consumeOrderConfirmations(kafkaBrokers, kafkaTopic)

	// Set up Gin router.
	router := gin.Default()

	// Configure CORS middleware.
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Actuator endpoints.
	router.GET("/actuator/health", healthCheck)
	router.GET("/actuator/loggers", getLoggerLevels)
	router.POST("/actuator/loggers", updateLoggerLevel)

	// Expose Prometheus metrics.
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// REST endpoints.
	router.GET("/inventory", getInventory)
	router.GET("/inventory/:productId", getInventoryByProduct)
	router.POST("/inventory", createInventory)
	router.PUT("/inventory/:productId", updateInventory)

	logger.Infof("Inventory Management service listening on port %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatalf("Failed to run Gin server: %v", err)
	}
}

// Actuator endpoint: health check.
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "UP"})
}

// Actuator endpoint: retrieve current logging level.
func getLoggerLevels(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"level": logger.GetLevel().String()})
}

// Actuator endpoint: update the logging level at runtime.
func updateLoggerLevel(c *gin.Context) {
	var body struct {
		Level string `json:"level"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	level, err := logrus.ParseLevel(body.Level)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid level"})
		return
	}
	logger.SetLevel(level)
	c.JSON(http.StatusOK, gin.H{"message": "Logger level updated", "level": level.String()})
}

// REST endpoint: get all inventory items.
func getInventory(c *gin.Context) {
	rows, err := db.Query("SELECT id, product_id, stock FROM inventory")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query inventory"})
		return
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		if err := rows.Scan(&item.ID, &item.ProductID, &item.Stock); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan inventory item"})
			return
		}
		items = append(items, item)
	}
	c.JSON(http.StatusOK, items)
}

// REST endpoint: get inventory by product ID.
func getInventoryByProduct(c *gin.Context) {
	productId := c.Param("productId")
	var item InventoryItem
	err := db.QueryRow("SELECT id, product_id, stock FROM inventory WHERE product_id = $1", productId).
		Scan(&item.ID, &item.ProductID, &item.Stock)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query inventory"})
		}
		return
	}
	c.JSON(http.StatusOK, item)
}

// REST endpoint: create a new inventory record.
func createInventory(c *gin.Context) {
	var item InventoryItem
	if err := c.BindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	if item.ProductID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ProductID is required"})
		return
	}
	err := db.QueryRow("INSERT INTO inventory (product_id, stock) VALUES ($1, $2) RETURNING id",
		item.ProductID, item.Stock).Scan(&item.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inventory item"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// REST endpoint: update inventory for a given product.
func updateInventory(c *gin.Context) {
	productId := c.Param("productId")
	var payload struct {
		Stock int `json:"stock"`
	}
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	res, err := db.Exec("UPDATE inventory SET stock = $1 WHERE product_id = $2", payload.Stock, productId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory"})
		return
	}
	count, err := res.RowsAffected()
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Inventory updated"})
}

// consumeOrderConfirmations starts a Kafka consumer that listens for order confirmation events.
func consumeOrderConfirmations(brokers, topic string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{brokers},
		Topic:    topic,
		GroupID:  "inventory-management-group",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})
	defer r.Close()

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			logger.Errorf("Error reading message from Kafka: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		logger.Infof("Received Kafka message at offset %d: %s", m.Offset, string(m.Value))
		processOrderConfirmation(m.Value)
	}
}

// processOrderConfirmation parses an order confirmation event and adjusts inventory.
func processOrderConfirmation(message []byte) {
	var event OrderConfirmation
	if err := json.Unmarshal(message, &event); err != nil {
		logger.Errorf("Error unmarshalling order confirmation: %v", err)
		return
	}
	// For each item in the order, adjust the inventory.
	for _, item := range event.Items {
		adjustInventory(item.ProductID, item.Quantity)
	}
}

// adjustInventory subtracts the given quantity from the inventory for the specified product.
func adjustInventory(productId string, quantity int) {
	res, err := db.Exec("UPDATE inventory SET stock = GREATEST(stock - $1, 0) WHERE product_id = $2", quantity, productId)
	if err != nil {
		logger.Errorf("Failed to adjust inventory for product %s: %v", productId, err)
		return
	}
	count, err := res.RowsAffected()
	if err != nil {
		logger.Errorf("Error retrieving affected rows: %v", err)
		return
	}
	if count == 0 {
		// Optionally, create a record if none exists.
		logger.Infof("No inventory record found for product %s. Creating a new record with stock 0.", productId)
		_, err = db.Exec("INSERT INTO inventory (product_id, stock) VALUES ($1, $2)", productId, 0)
		if err != nil {
			logger.Errorf("Failed to insert inventory record for product %s: %v", productId, err)
		}
	} else {
		logger.Infof("Adjusted inventory for product %s by reducing %d units", productId, quantity)
	}
}
