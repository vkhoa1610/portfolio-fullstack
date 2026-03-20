package com.example.my_java_app.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for Ollama OpenAI-compatible API.
 * Endpoint: POST {ollamaBaseUrl}/v1/chat/completions
 *
 * Ollama must be running (docker:ai:on) for real calls.
 * Throws exception if unavailable — caller should fallback to mock.
 */
@Component
public class OllamaClient {

    private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3.2:3b}")
    private String model;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OllamaClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Send a prompt to Ollama and return the response content string.
     * Timeout: 120s (LLM generation can be slow on CPU).
     *
     * @throws Exception if Ollama is unreachable or returns error
     */
    public String chat(String prompt) throws Exception {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "stream", false
        );

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ollamaBaseUrl + "/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(120))
                .build();

        log.info("Calling Ollama model={} url={}", model, ollamaBaseUrl);
        log.debug("Ollama prompt:\n{}", prompt);

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Ollama returned HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText();

        if (content.isBlank()) {
            throw new RuntimeException("Ollama returned empty content");
        }

        log.info("Ollama response received ({} chars)", content.length());
        log.debug("Ollama response:\n{}", content);
        return content;
    }
}
