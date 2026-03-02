package com.example.backend.gedcom.api;

import com.example.backend.gedcom.application.JsonExportService;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JsonExportController {

  private final JsonExportService jsonExportService;

  public JsonExportController(JsonExportService jsonExportService) {
    this.jsonExportService = jsonExportService;
  }

  @GetMapping("/api/trees/{treeId}/export/json")
  public ResponseEntity<byte[]> exportJson(@PathVariable UUID treeId) {
    String json = jsonExportService.export(treeId);
    byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"family-tree.json\"")
        .contentType(MediaType.APPLICATION_JSON)
        .body(bytes);
  }
}
