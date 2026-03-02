package com.example.backend.gedcom.api;

import com.example.backend.gedcom.application.GedcomExportService;
import com.example.backend.gedcom.application.GedcomImportService;
import com.example.backend.gedcom.application.GedcomImportService.ImportResult;
import com.example.backend.gedcom.application.GedcomImportService.PreviewResult;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/trees/{treeId}/gedcom")
public class GedcomController {

  private final GedcomExportService exportService;
  private final GedcomImportService importService;

  public GedcomController(GedcomExportService exportService, GedcomImportService importService) {
    this.exportService = exportService;
    this.importService = importService;
  }

  @GetMapping
  public ResponseEntity<byte[]> export(@PathVariable UUID treeId) {
    String content = exportService.export(treeId);
    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"family-tree.ged\"")
        .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
        .body(bytes);
  }

  @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public PreviewResult previewGedcom(
      @PathVariable UUID treeId,
      @RequestParam("file") MultipartFile file
  ) throws IOException {
    String content = new String(file.getBytes(), StandardCharsets.UTF_8);
    return importService.previewGedcom(treeId, content);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ImportResult importGedcom(
      @PathVariable UUID treeId,
      @RequestParam("file") MultipartFile file
  ) throws IOException {
    String content = new String(file.getBytes(), StandardCharsets.UTF_8);
    return importService.importGedcom(treeId, content);
  }
}
