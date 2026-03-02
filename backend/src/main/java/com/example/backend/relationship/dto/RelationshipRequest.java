package com.example.backend.relationship.dto;

import com.example.backend.relationship.entity.RelationshipType;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class RelationshipRequest {

  @NotNull
  private UUID fromPersonId;

  @NotNull
  private UUID toPersonId;

  @NotNull
  private RelationshipType type;

  public UUID getFromPersonId() { return fromPersonId; }
  public void setFromPersonId(UUID fromPersonId) { this.fromPersonId = fromPersonId; }

  public UUID getToPersonId() { return toPersonId; }
  public void setToPersonId(UUID toPersonId) { this.toPersonId = toPersonId; }

  public RelationshipType getType() { return type; }
  public void setType(RelationshipType type) { this.type = type; }
}
