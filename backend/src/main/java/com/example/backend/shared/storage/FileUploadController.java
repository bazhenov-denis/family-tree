package com.example.backend.shared.storage;

import java.util.Map;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

  private final StorageService storageService;

  public FileUploadController(StorageService storageService) {
    this.storageService = storageService;
  }

  @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, String>> uploadImage(
      @RequestParam("file") MultipartFile file
  ) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
    }

    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
    }

    String url = storageService.uploadImage(file);
    return ResponseEntity.ok(Map.of("url", url));
  }

  private static final Set<String> ALLOWED_DOC_TYPES = Set.of(
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain"
  );

  @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, String>> uploadFile(
      @RequestParam("file") MultipartFile file
  ) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
    }
    if (file.getSize() > 20 * 1024 * 1024) {
      return ResponseEntity.badRequest().body(Map.of("error", "File too large (max 20 MB)"));
    }

    String contentType = file.getContentType();
    boolean isImage = contentType != null && contentType.startsWith("image/");
    boolean isDoc   = contentType != null && ALLOWED_DOC_TYPES.contains(contentType);

    if (!isImage && !isDoc) {
      return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type"));
    }

    String url = isImage
        ? storageService.uploadImage(file)
        : storageService.uploadDocument(file);

    String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
    return ResponseEntity.ok(Map.of(
        "url",      url,
        "mimeType", contentType,
        "fileName", originalName
    ));
  }
}
