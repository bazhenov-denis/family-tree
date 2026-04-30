package com.example.backend.tree.dto;

import java.time.Instant;
import java.util.UUID;

public class TreeResponse {

  private UUID id;
  private String title;
  private String description;
  private Instant createdAt;
  private Instant updatedAt;
  private String role;
  private int personCount;
  private int eventCount;
  private int mediaCount;

  public TreeResponse(
      UUID id,
      String title,
      String description,
      Instant createdAt,
      Instant updatedAt,
      String role,
      int personCount,
      int eventCount,
      int mediaCount
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.role = role;
    this.personCount = personCount;
    this.eventCount = eventCount;
    this.mediaCount = mediaCount;
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

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public String getRole() {
    return role;
  }

  public int getPersonCount() {
    return personCount;
  }

  public int getEventCount() {
    return eventCount;
  }

  public int getMediaCount() {
    return mediaCount;
  }
}
