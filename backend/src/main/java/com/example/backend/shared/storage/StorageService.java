package com.example.backend.shared.storage;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import java.io.InputStream;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;



@Service
public class StorageService {

  private final MinioClient minioClient;
  private final String bucket;

  public StorageService(
      MinioClient minioClient,
      @Value("${minio.bucket}") String bucket
  ) {
    this.minioClient = minioClient;
    this.bucket = bucket;
  }

  public String uploadImage(MultipartFile file) {
    return upload(file, "photos/");
  }

  public String uploadDocument(MultipartFile file) {
    return upload(file, "documents/");
  }

  private String upload(MultipartFile file, String prefix) {
    String originalFilename = file.getOriginalFilename();
    String extension = "";
    if (originalFilename != null && originalFilename.contains(".")) {
      extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
    String objectName = prefix + UUID.randomUUID() + extension;

    try (InputStream inputStream = file.getInputStream()) {
      minioClient.putObject(PutObjectArgs.builder()
          .bucket(bucket)
          .object(objectName)
          .stream(inputStream, file.getSize(), -1)
          .contentType(file.getContentType())
          .build());
    } catch (Exception e) {
      throw new RuntimeException("Failed to upload file to MinIO", e);
    }

    return "/media/" + objectName;
  }
}
