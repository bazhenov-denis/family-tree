package com.example.backend.dto.tree;

public class RelationshipGraphDto {

  private String id;
  private String from;
  private String to;
  private String type;

  public RelationshipGraphDto(String id, String from, String to, String type) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.type = type;
  }

  public String getId() {
    return id;
  }

  public String getFrom() {
    return from;
  }

  public String getTo() {
    return to;
  }

  public String getType() {
    return type;
  }
}
