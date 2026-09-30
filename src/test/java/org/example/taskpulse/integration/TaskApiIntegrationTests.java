package org.example.taskpulse.integration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TaskApiIntegrationTests {

    @LocalServerPort
    int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void servesTaskPulseDashboard() throws Exception {
        HttpResponse<String> response = sendHtml("GET", "/");

        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.headers().firstValue("content-type").orElse(""))
                .contains("text/html");
        assertThat(response.body()).contains("TaskPulse", "Your task pulse");
    }

    @Test
    void createAndListTasks() throws Exception {
        String created = request("POST", "/api/tasks",
                "{\"title\":\"Ship dashboard\",\"description\":\"Connect the frontend to TaskPulse\"}");

        assertThat(created).contains("\"title\":\"Ship dashboard\"")
                .contains("\"status\":\"TODO\"");

        HttpResponse<String> list = send("GET", "/api/tasks", null);

        assertThat(list.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(list.body()).contains("Ship dashboard");
    }

    @Test
    void updateTaskAndFilterByStatus() throws Exception {
        String created = request("POST", "/api/tasks",
                "{\"title\":\"Review release notes\",\"description\":\"Check final wording\"}");
        long id = readId(created);

        String updated = request("PUT", "/api/tasks/" + id,
                "{\"title\":\"Review release notes\",\"description\":\"Approved for release\",\"status\":\"DONE\"}");

        assertThat(updated).contains("\"status\":\"DONE\"")
                .contains("Approved for release");

        HttpResponse<String> filtered = send("GET", "/api/tasks?status=DONE", null);
        assertThat(filtered.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(filtered.body()).contains("Review release notes");
    }

    @Test
    void deleteTaskAndReturnNotFoundAfterwards() throws Exception {
        String created = request("POST", "/api/tasks",
                "{\"title\":\"Temporary task\",\"description\":null}");
        long id = readId(created);

        HttpResponse<String> deleted = send("DELETE", "/api/tasks/" + id, null);
        assertThat(deleted.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());

        HttpResponse<String> missing = send("GET", "/api/tasks/" + id, null);
        assertThat(missing.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(missing.body()).contains("Task with id " + id + " was not found");
    }

    private String request(String method, String path, String body) throws Exception {
        HttpResponse<String> response = send(method, path, body);
        assertThat(response.statusCode()).isBetween(200, 299);
        return response.body();
    }

    private HttpResponse<String> send(String method, String path, String body) throws IOException, InterruptedException {
        return send(method, path, body, MediaType.APPLICATION_JSON_VALUE);
    }

    private HttpResponse<String> sendHtml(String method, String path) throws IOException, InterruptedException {
        return send(method, path, null, MediaType.TEXT_HTML_VALUE);
    }

    private HttpResponse<String> send(String method, String path, String body, String accept) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Accept", accept);

        if (body != null) {
            builder.header("Content-Type", MediaType.APPLICATION_JSON_VALUE);
        }

        HttpRequest request = switch (method) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(body)).build();
            case "DELETE" -> builder.DELETE().build();
            default -> builder.GET().build();
        };

        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private long readId(String json) {
        String marker = "\"id\":";
        int start = json.indexOf(marker);
        assertThat(start).isGreaterThanOrEqualTo(0);
        int valueStart = start + marker.length();
        int valueEnd = json.indexOf(',', valueStart);
        if (valueEnd < 0) {
            valueEnd = json.indexOf('}', valueStart);
        }
        return Long.parseLong(json.substring(valueStart, valueEnd));
    }
}
