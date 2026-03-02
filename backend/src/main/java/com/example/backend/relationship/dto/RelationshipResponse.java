package com.example.backend.relationship.dto;

import com.example.backend.relationship.entity.Relationship;
import java.util.UUID;

public class RelationshipResponse {

  private UUID id;
  private UUID fromPersonId;
  private UUID toPersonId;
  private String type;

  public RelationshipResponse(Relationship r) {
    this.id = r.getId();
    this.fromPersonId = r.getFromPerson().getId();
    this.toPersonId = r.getToPerson().getId();
    this.type = r.getType().name();
  }

  public UUID getId() { return id; }
  public UUID getFromPersonId() { return fromPersonId; }
  public UUID getToPersonId() { return toPersonId; }
  public String getType() { return type; }
}
