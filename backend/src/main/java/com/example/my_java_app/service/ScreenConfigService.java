package com.example.my_java_app.service;

import com.example.my_java_app.entity.ScreenConfigEntity;
import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.ScreenConfigRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.Optional;

@Service
public class ScreenConfigService {

    private final ScreenConfigRepository screenConfigRepository;
    private final SystemAdminRepository systemAdminRepository;
    private final ObjectMapper objectMapper;

    public ScreenConfigService(ScreenConfigRepository screenConfigRepository,
                               SystemAdminRepository systemAdminRepository,
                               ObjectMapper objectMapper) {
        this.screenConfigRepository = screenConfigRepository;
        this.systemAdminRepository = systemAdminRepository;
        this.objectMapper = objectMapper;
    }

    /** Returns the active config JSON string for a screen. */
    @Transactional(readOnly = true)
    public String getActiveConfig(String screenKey) {
        Optional<ScreenConfigEntity> opt = screenConfigRepository.findActive(screenKey);
        if (opt.isEmpty()) {
            throw new NotFoundException("Screen config not found: " + screenKey);
        }
        return opt.get().getConfigJson();
    }

    /**
     * Apply a CSV patch to the active screen config and save as a new version.
     *
     * CSV format (no header row):
     *   nodeId,propertyPath,newValue
     *
     * Example:
     *   btn-accept,label_key,manager.btn.approve_now
     *   btn-reject,variant,warning
     *
     * Rules:
     * - nodeId:       matches node's "id" field anywhere in the tree
     * - propertyPath: dot-separated path relative to the matched node object
     *                 (e.g. "label_key" or "style.color")
     * - newValue:     always treated as a string (button labels, keys, etc.)
     *
     * Only system admins may patch configs.
     */
    public void applyPatch(String adminSub, String screenKey, String csvContent) {
        requireAdmin(adminSub);

        ScreenConfigEntity current = screenConfigRepository.findActive(screenKey)
                .orElseThrow(() -> new NotFoundException("Screen config not found: " + screenKey));

        JsonNode root;
        try {
            root = objectMapper.readTree(current.getConfigJson());
        } catch (IOException e) {
            throw new ApiException("Existing config JSON is malformed: " + e.getMessage());
        }

        try (BufferedReader reader = new BufferedReader(new StringReader(csvContent))) {
            String line;
            int lineNum = 0;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String[] parts = line.split(",", 3);
                if (parts.length < 3) {
                    throw new ApiException("CSV line " + lineNum + " is invalid (expected nodeId,propertyPath,newValue)");
                }
                String nodeId       = parts[0].trim();
                String propertyPath = parts[1].trim();
                String newValue     = parts[2].trim();

                JsonNode targetNode = findNodeById(root, nodeId);
                if (targetNode == null || !targetNode.isObject()) {
                    throw new ApiException("CSV line " + lineNum + ": node id '" + nodeId + "' not found");
                }

                setNestedProperty((ObjectNode) targetNode, propertyPath, newValue);
            }
        } catch (IOException e) {
            throw new ApiException("Failed to read CSV: " + e.getMessage());
        }

        String patchedJson;
        try {
            patchedJson = objectMapper.writeValueAsString(root);
        } catch (IOException e) {
            throw new ApiException("Failed to serialize patched config: " + e.getMessage());
        }

        int nextVersion = screenConfigRepository.getNextVersion(screenKey);
        ScreenConfigEntity newEntity = new ScreenConfigEntity();
        newEntity.setScreenKey(screenKey);
        newEntity.setVersion(nextVersion);
        newEntity.setConfigJson(patchedJson);
        newEntity.setUpdatedBy(adminSub);

        screenConfigRepository.saveNewVersion(newEntity);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** DFS search for a node with "id" == targetId anywhere in the tree. */
    private JsonNode findNodeById(JsonNode node, String targetId) {
        if (node == null) return null;
        if (node.isObject()) {
            JsonNode idField = node.get("id");
            if (idField != null && targetId.equals(idField.asText())) {
                return node;
            }
            for (JsonNode child : node) {
                JsonNode found = findNodeById(child, targetId);
                if (found != null) return found;
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                JsonNode found = findNodeById(child, targetId);
                if (found != null) return found;
            }
        }
        return null;
    }

    /**
     * Set a (possibly nested) property on an ObjectNode.
     * E.g. path="style.color", value="red" → node.style.color = "red"
     */
    private void setNestedProperty(ObjectNode node, String path, String value) {
        String[] keys = path.split("\\.", 2);
        if (keys.length == 1) {
            node.put(keys[0], value);
        } else {
            JsonNode child = node.get(keys[0]);
            if (child == null || !child.isObject()) {
                ObjectNode newChild = objectMapper.createObjectNode();
                node.set(keys[0], newChild);
                child = newChild;
            }
            setNestedProperty((ObjectNode) child, keys[1], value);
        }
    }

    private void requireAdmin(String cognitoSub) {
        if (systemAdminRepository.findBySub(cognitoSub).isEmpty()) {
            throw new ForbiddenException("Caller is not a system admin");
        }
    }
}
