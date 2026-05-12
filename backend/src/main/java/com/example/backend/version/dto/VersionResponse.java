package com.example.backend.version.dto;

import java.time.Instant;
import java.util.UUID;

public class VersionResponse {

  private UUID id;
  private String name;
  private String description;
  private String type;
  private String state;
  private UUID parentId;
  private UUID baseSnapshotId;
  private Instant createdAt;
  private String createdBy;
  private int entityCount;
  private UUID clonedTreeId;

  public VersionResponse(UUID id, String name, String description, String type, String state,
                         UUID parentId, UUID baseSnapshotId, Instant createdAt, String createdBy, int entityCount) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.state = state;
    this.parentId = parentId;
    this.baseSnapshotId = baseSnapshotId;
    this.createdAt = createdAt;
    this.createdBy = createdBy;
    this.entityCount = entityCount;
  }

  public UUID getId() { return id; }
  public String getName() { return name; }
  public String getDescription() { return description; }
  public String getType() { return type; }
  public String getState() { return state; }
  public UUID getParentId() { return parentId; }
  public UUID getBaseSnapshotId() { return baseSnapshotId; }
  public Instant getCreatedAt() { return createdAt; }
  public String getCreatedBy() { return createdBy; }
  public int getEntityCount() { return entityCount; }
  public UUID getClonedTreeId() { return clonedTreeId; }
  public void setClonedTreeId(UUID clonedTreeId) { this.clonedTreeId = clonedTreeId; }
}
