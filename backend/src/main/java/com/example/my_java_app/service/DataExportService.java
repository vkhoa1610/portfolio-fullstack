package com.example.my_java_app.service;

import com.example.my_java_app.entity.ExpenseEntity;
import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.entity.UserConsentEntity;
import com.example.my_java_app.entity.UserProfileEntity;
import com.example.my_java_app.repository.ExpenseRepository;
import com.example.my_java_app.repository.GdprAuditLogRepository;
import com.example.my_java_app.repository.UserConsentRepository;
import com.example.my_java_app.repository.UserProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * GDPR Art. 20 — Right to data portability.
 * Builds a ZIP archive containing the data subject's personal records in
 * machine-readable JSON. Audited via {@link GdprService#recordDataExport}.
 */
@Service
public class DataExportService {

    private final UserProfileRepository profileRepository;
    private final ExpenseRepository expenseRepository;
    private final UserConsentRepository consentRepository;
    private final GdprAuditLogRepository auditLogRepository;
    private final GdprService gdprService;
    private final ObjectMapper objectMapper;

    public DataExportService(UserProfileRepository profileRepository,
                             ExpenseRepository expenseRepository,
                             UserConsentRepository consentRepository,
                             GdprAuditLogRepository auditLogRepository,
                             GdprService gdprService,
                             ObjectMapper objectMapper) {
        this.profileRepository = profileRepository;
        this.expenseRepository = expenseRepository;
        this.consentRepository = consentRepository;
        this.auditLogRepository = auditLogRepository;
        this.gdprService = gdprService;
        // Use a fresh mapper with pretty-print so the exported files are human-readable.
        this.objectMapper = objectMapper.copy().enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Build the ZIP archive for the given subject. Returns raw bytes ready to stream to the client.
     * Records the {@code DATA_EXPORTED} audit event before returning.
     */
    public byte[] buildExport(String subjectSub) throws IOException {
        UserProfileEntity profile = profileRepository.findByUserSub(subjectSub);
        List<ExpenseEntity> expenses = expenseRepository.findByUserSub(subjectSub);
        List<UserConsentEntity> consents = consentRepository.findByUserSub(subjectSub);
        List<GdprAuditLogEntity> audit = auditLogRepository.findBySubjectToken(
                GdprService.subjectTokenFor(subjectSub));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            writeEntry(zip, "manifest.json", buildManifest(subjectSub, profile, expenses, consents, audit));
            writeEntry(zip, "profile.json", profile);
            writeEntry(zip, "expenses.json", expenses);
            writeEntry(zip, "consents.json", consents);
            writeEntry(zip, "gdpr_audit_log.json", audit);
        }

        int recordCount = (profile == null ? 0 : 1) + expenses.size() + consents.size() + audit.size();
        gdprService.recordDataExport(subjectSub, subjectSub, "EMPLOYEE", recordCount);

        return baos.toByteArray();
    }

    private void writeEntry(ZipOutputStream zip, String name, Object payload) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(objectMapper.writeValueAsBytes(payload == null ? Map.of() : payload));
        zip.closeEntry();
    }

    private Map<String, Object> buildManifest(String subjectSub,
                                              UserProfileEntity profile,
                                              List<ExpenseEntity> expenses,
                                              List<UserConsentEntity> consents,
                                              List<GdprAuditLogEntity> audit) {
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("subjectSub", subjectSub);
        manifest.put("generatedAt", LocalDateTime.now().toString());
        manifest.put("specReference", "GDPR Art. 20 — Right to Data Portability");
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("profile", profile == null ? 0 : 1);
        counts.put("expenses", expenses.size());
        counts.put("consents", consents.size());
        counts.put("auditLog", audit.size());
        manifest.put("recordCounts", counts);
        return manifest;
    }
}
