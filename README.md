# TaskPulse

A tiny task-management REST API using Java, Spring Boot, H2, and a lightweight browser UI.

## Run locally

Make sure `MY_DATABASE_PASSWORD` is available in your shell, then run:

```bash
./mvnw spring-boot:run
```

Open <http://localhost:8088> for the TaskPulse dashboard.

### Change the port manually

The permanent project setting is in `src/main/resources/application.properties`:

```properties
server.port=8088
```

You can temporarily override it without editing the file:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8088"
```

Or when running the packaged JAR:

```bash
java -jar target/TaskPulse-0.0.1-SNAPSHOT.jar --server.port=8088
```

## Tests

The integration tests start the real Spring Boot HTTP server on a random free port and exercise the task API over HTTP. Test data uses an isolated in-memory H2 database.

```bash
./mvnw test
```
