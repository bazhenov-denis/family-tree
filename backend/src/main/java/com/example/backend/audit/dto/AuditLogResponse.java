package com.example.backend.audit.dto;

import com.example.backend.audit.entity.AuditLog;
import java.time.Instant;
import java.util.UUID;

public class AuditLogResponse {

  private UUID id;
  private String userName;
  private String action;
  private String entityType;
  private UUID entityId;
  private String description;
  private Instant createdAt;

  public AuditLogResponse(AuditLog log) {
    this.id = log.getId();
    this.action = log.getAction();
    this.entityType = log.getEntityType();
    this.entityId = log.getEntityId();
    this.createdAt = log.getCreatedAt();

    // Display name: prefer user's name, fall back to email
    var user = log.getUser();
    this.userName = (user.getName() != null && !user.getName().isBlank())
        ? user.getName() : user.getEmail();

    // Human-readable description
    String state = log.getAfterState() != null ? log.getAfterState() : log.getBeforeState();
    String detail = extractDetail(state);
    this.description = switch (log.getAction()) {
      case "CREATE_PERSON"        -> "добавил(а) человека: " + detail;
      case "UPDATE_PERSON"        -> "обновил(а) данные: " + detail;
      case "DELETE_PERSON"        -> "удалил(а) человека: " + detail;
      case "CREATE_RELATIONSHIP"  -> "добавил(а) связь: " + detail;
      case "DELETE_RELATIONSHIP"  -> "удалил(а) связь: " + detail;
      default -> log.getAction() + ": " + detail;
    };
  }

  /** Extracts the "desc" string value from a simple {"desc":"..."} JSON blob. */
  private static String extractDetail(String json) {
    if (json == null) return "";
    int start = json.indexOf("\"desc\":\"");
    if (start < 0) return "";
    start += 8;
    int end = json.indexOf("\"", start);
    if (end < 0) return json;
    return json.substring(start, end).replace("\\\"", "\"");
  }

  public UUID getId() { return id; }
  public String getUserName() { return userName; }
  public String getAction() { return action; }
  public String getEntityType() { return entityType; }
  public UUID getEntityId() { return entityId; }
  public String getDescription() { return description; }
  public Instant getCreatedAt() { return createdAt; }
}
