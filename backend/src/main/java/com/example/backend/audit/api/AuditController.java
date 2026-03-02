package com.example.backend.audit.api;

import com.example.backend.audit.application.AuditService;
import com.example.backend.audit.dto.AuditLogResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/audit")
public class AuditController {

  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @GetMapping
  public List<AuditLogResponse> list(
      @PathVariable UUID treeId,
      @RequestParam(defaultValue = "50") int size
  ) {
    return auditService.list(treeId, size);
  }
}
