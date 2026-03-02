package com.example.backend.graph.dto;

import java.util.UUID;

public class RelationRow {

  private UUID id;
  private UUID fromId;
  private UUID toId;
  private String type;

  public RelationRow(UUID id, UUID fromId, UUID toId, String type) {
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
    this.type = type;
  }

  public UUID getId() { return id; }
  public UUID getFromId() { return fromId; }
  public UUID getToId() { return toId; }
  public String getType() { return type; }
}
