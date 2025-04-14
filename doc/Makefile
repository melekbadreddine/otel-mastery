# Makefile for E-commerce API Documentation

# Variables
SWAGGER_UI_VERSION=5.4.2
SWAGGER_UI_DIR=swagger-ui
SWAGGER_YAML=swagger.yaml
SWAGGER_JSON=swagger.json
DOC_PORT=8100
DOCKER_IMAGE=swaggerapi/swagger-ui:v$(SWAGGER_UI_VERSION)

.PHONY: help install serve serve-docker clean validate convert yaml-to-json

help:
	@echo "E-commerce API Documentation Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make install       - Install Swagger UI locally"
	@echo "  make serve         - Serve Swagger UI using Python's HTTP server"
	@echo "  make serve-docker  - Serve Swagger UI using Docker (recommended)"
	@echo "  make validate      - Validate the OpenAPI specification"
	@echo "  make convert       - Convert YAML to JSON"
	@echo "  make clean         - Remove installed Swagger UI"

# Install Swagger UI locally
install:
	@echo "Installing Swagger UI v$(SWAGGER_UI_VERSION)..."
	@mkdir -p $(SWAGGER_UI_DIR)
	@curl -sL "https://github.com/swagger-api/swagger-ui/archive/v$(SWAGGER_UI_VERSION).tar.gz" | tar xz -C $(SWAGGER_UI_DIR) --strip-components=2 "swagger-ui-$(SWAGGER_UI_VERSION)/dist"
	@cp $(SWAGGER_YAML) $(SWAGGER_UI_DIR)/
	@sed -i.bak 's|https://petstore.swagger.io/v2/swagger.json|./$(SWAGGER_YAML)|g' $(SWAGGER_UI_DIR)/index.html
	@rm $(SWAGGER_UI_DIR)/index.html.bak
	@echo "Swagger UI installed successfully in $(SWAGGER_UI_DIR)/"

# Serve Swagger UI using Python's built-in HTTP server
serve: install
	@echo "Starting HTTP server on port $(DOC_PORT)..."
	@cd $(SWAGGER_UI_DIR) && python3 -m http.server $(DOC_PORT) || python -m SimpleHTTPServer $(DOC_PORT)
	@echo "Swagger UI is available at http://localhost:$(DOC_PORT)"

# Serve Swagger UI using Docker (recommended)
serve-docker:
	@echo "Starting Swagger UI in Docker on port $(DOC_PORT)..."
	@docker run -p $(DOC_PORT):8080 -e SWAGGER_JSON=/foo/$(SWAGGER_YAML) -v $(PWD):/foo $(DOCKER_IMAGE)
	@echo "Swagger UI is available at http://localhost:$(DOC_PORT)"

# Convert YAML to JSON
yaml-to-json:
	@echo "Converting $(SWAGGER_YAML) to $(SWAGGER_JSON)..."
	@command -v yq >/dev/null 2>&1 || { echo "Error: yq is required but not installed. Install with: pip install yq"; exit 1; }
	@yq -o=json '.' $(SWAGGER_YAML) > $(SWAGGER_JSON)
	@echo "Conversion complete: $(SWAGGER_JSON)"

# Convert and then validate
convert: yaml-to-json

# Validate the OpenAPI specification
validate: yaml-to-json
	@echo "Validating OpenAPI specification..."
	@command -v swagger-cli >/dev/null 2>&1 || { echo "Error: swagger-cli is required but not installed. Install with: npm install -g @apidevtools/swagger-cli"; exit 1; }
	@swagger-cli validate $(SWAGGER_JSON)
	@echo "Validation successful!"

# Clean up installed files
clean:
	@echo "Removing Swagger UI installation..."
	@rm -rf $(SWAGGER_UI_DIR)
	@echo "Cleanup complete."