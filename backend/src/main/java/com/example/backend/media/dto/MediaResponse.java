package com.example.backend.media.dto;

import com.example.backend.media.entity.Media;
import java.time.Instant;
import java.util.UUID;

public class MediaResponse {

  private UUID id;
  private UUID personId;
  private UUID eventId;
  private String url;
  private String description;
  private String mimeType;
  private String fileName;
  private Instant createdAt;

  public MediaResponse(Media m) {
    this.id          = m.getId();
    this.personId    = m.getPerson() != null ? m.getPerson().getId() : null;
    this.eventId     = m.getEvent()  != null ? m.getEvent().getId()  : null;
    this.url         = m.getUrl();
    this.description = m.getDescription();
    this.mimeType    = m.getMimeType();
    this.fileName    = m.getFileName();
    this.createdAt   = m.getCreatedAt();
  }

  public UUID getId()           { return id; }
  public UUID getPersonId()     { return personId; }
  public UUID getEventId()      { return eventId; }
  public String getUrl()        { return url; }
  public String getDescription(){ return description; }
  public String getMimeType()   { return mimeType; }
  public String getFileName()   { return fileName; }
  public Instant getCreatedAt() { return createdAt; }
}
