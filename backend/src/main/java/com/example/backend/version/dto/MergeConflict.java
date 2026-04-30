package com.example.backend.version.dto;

import java.util.UUID;

public class MergeConflict {

  private String entityType;
  private UUID entityId;
  private String entityName;
  private String ours;
  private String theirs;

  public MergeConflict(String entityType, UUID entityId, String entityName, String ours, String theirs) {
    this.entityType = entityType;
    this.entityId = entityId;
    this.entityName = entityName;
    this.ours = ours;
    this.theirs = theirs;
  }

  public String getEntityType() { return entityType; }
  public UUID getEntityId() { return entityId; }
  public String getEntityName() { return entityName; }
  public String getOurs() { return ours; }
  public String getTheirs() { return theirs; }
}
