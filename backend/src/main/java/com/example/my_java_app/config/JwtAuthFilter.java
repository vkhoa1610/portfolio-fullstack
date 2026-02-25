package com.example.my_java_app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * JWT Filter — chỉ decode (không verify signature vì BFF đã verify qua
 * Cognito).
 * Extract `sub` claim từ Cognito ID Token, set vào request attribute
 * "cognitoSub".
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Missing or invalid Authorization header\"}");
            return;
        }

        String token = authHeader.substring(7); // Remove "Bearer " prefix

        try {
            String cognitoSub = extractSubFromJwt(token);
            request.setAttribute("cognitoSub", cognitoSub);
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            logger.warn("Failed to decode JWT token: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid token\"}");
        }
    }

    /**
     * Decode JWT payload (Base64URL) và extract claim `sub`.
     * JWT format: header.payload.signature — chỉ cần phần payload.
     */
    @SuppressWarnings("unchecked")
    private String extractSubFromJwt(String jwtToken) throws Exception {
        String[] parts = jwtToken.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JWT structure");
        }

        // Decode Base64URL payload (padding-safe)
        String payload = parts[1];
        byte[] decodedBytes = Base64.getUrlDecoder().decode(addPadding(payload));
        String payloadJson = new String(decodedBytes);

        Map<String, Object> claims = OBJECT_MAPPER.readValue(payloadJson, Map.class);
        String sub = (String) claims.get("sub");

        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Missing 'sub' claim in JWT");
        }

        return sub;
    }

    /** Add Base64 padding if needed */
    private String addPadding(String base64) {
        int mod = base64.length() % 4;
        if (mod == 2)
            return base64 + "==";
        if (mod == 3)
            return base64 + "=";
        return base64;
    }

    /**
     * Chỉ áp dụng filter cho /api/v1/** endpoints.
     * Các route khác (e.g. /api/users/**) không bị filter.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/");
    }
}
