package com.example.backend.version.dto;

import java.util.List;
import java.util.Map;

public class SnapshotPreviewResponse {

  private List<Map<String, Object>> persons;
  private List<Map<String, Object>> relationships;
  private List<Map<String, Object>> events;
  private List<Map<String, Object>> media;

  public SnapshotPreviewResponse(
      List<Map<String, Object>> persons,
      List<Map<String, Object>> relationships,
      List<Map<String, Object>> events,
      List<Map<String, Object>> media) {
    this.persons = persons;
    this.relationships = relationships;
    this.events = events;
    this.media = media;
  }

  public List<Map<String, Object>> getPersons() { return persons; }
  public List<Map<String, Object>> getRelationships() { return relationships; }
  public List<Map<String, Object>> getEvents() { return events; }
  public List<Map<String, Object>> getMedia() { return media; }
}
