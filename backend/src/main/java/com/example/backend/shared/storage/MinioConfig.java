package com.example.backend.shared.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

  @Value("${minio.endpoint}")
  private String endpoint;

  @Value("${minio.access-key}")
  private String accessKey;

  @Value("${minio.secret-key}")
  private String secretKey;

  @Value("${minio.bucket}")
  private String bucket;

  @Bean
  public MinioClient minioClient() throws Exception {
    MinioClient client = MinioClient.builder()
        .endpoint(endpoint)
        .credentials(accessKey, secretKey)
        .build();

    boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
    if (!exists) {
      client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());

      // Make bucket publicly readable
      String policy = """
          {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": ["arn:aws:s3:::%s/*"]
              }
            ]
          }
          """.formatted(bucket);

      client.setBucketPolicy(SetBucketPolicyArgs.builder()
          .bucket(bucket)
          .config(policy)
          .build());
    }

    return client;
  }
}
