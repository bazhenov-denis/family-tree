package com.example.backend.tree.dto;

import java.time.Instant;
import java.util.UUID;

public class TreeResponse {

  private UUID id;
  private String title;
  private String description;
  private Instant createdAt;
  private String role;

  public TreeResponse(
      UUID id,
      String title,
      String description,
      Instant createdAt,
      String role
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.role = role;
  }

  public UUID getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public String getRole() {
    return role;
  }
}
