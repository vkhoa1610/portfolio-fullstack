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
 * HTTP client for Groq API (OpenAI-compatible).
 * Endpoint: POST https://api.groq.com/openai/v1/chat/completions
 *
 * Free tier: 14,400 requests/day, no credit card required.
 * Throws exception if unavailable — caller should fallback to mock.
 */
@Component
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    @Value("${groq.base-url:https://api.groq.com/openai}")
    private String baseUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    @Value("${groq.api-key}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GroqClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getModel() {
        return model;
    }

    /**
     * Send a prompt to Groq and return the response content string.
     * Timeout: 30s (Groq is fast — typical response under 3s).
     *
     * @throws Exception if Groq is unreachable or returns error
     */
    public String chat(String prompt) throws Exception {
        return chatWithSystem(null, prompt);
    }

    /**
     * Send system + user prompt to Groq.
     * If systemPrompt is null/blank, falls back to user-only message list.
     */
    public String chatWithSystem(String systemPrompt, String userPrompt) throws Exception {
        List<Map<String, String>> messages = (systemPrompt != null && !systemPrompt.isBlank())
                ? List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user",   "content", userPrompt))
                : List.of(Map.of("role", "user", "content", userPrompt));

        Map<String, Object> requestBody = Map.of(
                "model",    model,
                "messages", messages,
                "stream",   false
        );

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(30))
                .build();

        log.info("Calling Groq model={}", model);
        log.debug("Groq prompt:\n{}", userPrompt);

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Groq returned HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText();

        if (content.isBlank()) {
            throw new RuntimeException("Groq returned empty content");
        }

        log.info("Groq response received ({} chars)", content.length());
        log.debug("Groq response:\n{}", content);
        return content;
    }
}
