package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	kafka "github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	mongoDriver "go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Product represents a product document in MongoDB.
type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price"`
	ImageURL    string             `bson:"image_url" json:"image_url"`
}

// ProductEvent represents an event that will be published to Kafka.
type ProductEvent struct {
	EventType string  `json:"event_type"`
	Product   Product `json:"product"`
}

var (
	// MongoDB collection for products.
	productCollection *mongoDriver.Collection
	// Kafka writer for publishing events.
	kafkaWriter *kafka.Writer
)

func main() {
	// Read configuration from environment variables (with defaults).
	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017")
	kafkaBroker := getEnv("KAFKA_BROKER", "localhost:9092")
	port := getEnv("PORT", "3001")

	// Connect to MongoDB.
	client, err := mongoDriver.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}
	// Ensure disconnection when the service shuts down.
	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Printf("MongoDB disconnect error: %v", err)
		}
	}()
	// Use database "catalog" and collection "products".
	productCollection = client.Database("catalog").Collection("products")

	// Create text index on "name" and "description" if not already present.
	createTextIndex()

	// Initialize Kafka writer.
	kafkaWriter = kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{kafkaBroker},
		Topic:   "product-events",
		// Optional: adjust other writer settings as needed.
		Balancer: &kafka.LeastBytes{},
	})
	defer kafkaWriter.Close()

	// Set up Gin router.
	router := gin.Default()
	
	// Configure CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:4200"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// RESTful endpoints.
	router.GET("/products", listProducts)
	router.GET("/products/:id", getProduct)
	router.POST("/products", createProduct)
	router.PUT("/products/:id", updateProduct)
	router.DELETE("/products/:id", deleteProduct)
	router.GET("/products/search", searchProducts)

	log.Printf("Product Catalog service running on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Gin server error: %v", err)
	}
}

// getEnv reads an environment variable or returns a default value.
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// createTextIndex ensures a text index exists on the "name" and "description" fields.
func createTextIndex() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexModel := mongoDriver.IndexModel{
		Keys: bson.D{
			{Key: "name", Value: "text"},
			{Key: "description", Value: "text"},
		},
	}
	_, err := productCollection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		log.Printf("Could not create text index: %v", err)
	} else {
		log.Println("Text index created or already exists on 'name' and 'description'")
	}
}

// publishEvent publishes a product event to Kafka.
func publishEvent(eventType string, product Product) error {
	event := ProductEvent{
		EventType: eventType,
		Product:   product,
	}
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %v", err)
	}

	msg := kafka.Message{
		Key:   []byte(product.ID.Hex()),
		Value: data,
		Time:  time.Now(),
	}
	err = kafkaWriter.WriteMessages(context.Background(), msg)
	if err != nil {
		return fmt.Errorf("failed to write Kafka message: %v", err)
	}
	log.Printf("Published %s event for product %s", eventType, product.ID.Hex())
	return nil
}

// listProducts returns all products.
func listProducts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := productCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching products"})
		return
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading products from cursor"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// getProduct returns a single product by ID.
func getProduct(c *gin.Context) {
	idParam := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var product Product
	err = productCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// createProduct creates a new product.
func createProduct(c *gin.Context) {
	var product Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate a new ObjectID for the product.
	product.ID = primitive.NewObjectID()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := productCollection.InsertOne(ctx, product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error inserting product"})
		return
	}

	// Publish create event.
	if err := publishEvent("create", product); err != nil {
		log.Printf("Kafka publish error: %v", err)
	}

	c.JSON(http.StatusCreated, product)
}

// updateProduct updates an existing product.
func updateProduct(c *gin.Context) {
	idParam := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Ensure the ID is set correctly.
	product.ID = objID

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"name":        product.Name,
			"description": product.Description,
			"price":       product.Price,
			"image_url":   product.ImageURL,
		},
	}
	_, err = productCollection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating product"})
		return
	}

	// Publish update event.
	if err := publishEvent("update", product); err != nil {
		log.Printf("Kafka publish error: %v", err)
	}

	c.JSON(http.StatusOK, product)
}

// deleteProduct removes a product.
func deleteProduct(c *gin.Context) {
	idParam := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Find the product first (so we can publish its data).
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var product Product
	err = productCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Delete the product.
	_, err = productCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting product"})
		return
	}

	// Publish delete event.
	if err := publishEvent("delete", product); err != nil {
		log.Printf("Kafka publish error: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

// searchProducts searches for products using MongoDB's text search.
func searchProducts(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Use MongoDB's text search operator.
	filter := bson.M{"$text": bson.M{"$search": query}}
	cursor, err := productCollection.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error performing search"})
		return
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading search results"})
		return
	}

	c.JSON(http.StatusOK, products)
}

