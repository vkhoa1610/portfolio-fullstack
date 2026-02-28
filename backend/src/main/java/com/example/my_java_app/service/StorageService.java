package com.example.my_java_app.service;

import com.example.my_java_app.dto.response.UploadUrlResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

@Service
public class StorageService {

    private final S3Presigner presigner;

    @Value("${storage.public-endpoint}")
    private String publicEndpoint;

    @Value("${storage.bucket}")
    private String bucket;

    public StorageService(S3Presigner presigner) {
        this.presigner = presigner;
    }

    public UploadUrlResponseDto generateUploadUrl(String filename) {
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
        String key = UUID.randomUUID() + ext;

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(r -> r.bucket(bucket).key(key))
                .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);

        // Presigner already uses publicEndpoint — URL is browser-accessible directly
        String uploadUrl = presigned.url().toString();
        String fileUrl = publicEndpoint + "/" + bucket + "/" + key;

        return new UploadUrlResponseDto(uploadUrl, fileUrl);
    }
}
