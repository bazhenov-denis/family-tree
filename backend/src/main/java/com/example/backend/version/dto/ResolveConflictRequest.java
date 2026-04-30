package com.example.backend.version.dto;

import java.util.UUID;

public class ResolveConflictRequest {

  private String entityType;
  private UUID entityId;
  private String resolution; // OURS | THEIRS

  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public UUID getEntityId() { return entityId; }
  public void setEntityId(UUID entityId) { this.entityId = entityId; }
  public String getResolution() { return resolution; }
  public void setResolution(String resolution) { this.resolution = resolution; }
}
