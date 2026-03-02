package com.example.backend.graph.dto;

import java.util.UUID;

public class RelationEdgeDto {

  private UUID id;
  private UUID from;
  private UUID to;
  private String type;

  public RelationEdgeDto(UUID id, UUID from, UUID to, String type) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.type = type;
  }

  public UUID getId() { return id; }
  public UUID getFrom() { return from; }
  public UUID getTo() { return to; }
  public String getType() { return type; }
}
