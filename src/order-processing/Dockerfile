FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/order-processing-0.0.1-SNAPSHOT.jar .
EXPOSE 3003
CMD ["java", "-jar", "order-processing-0.0.1-SNAPSHOT.jar"]
