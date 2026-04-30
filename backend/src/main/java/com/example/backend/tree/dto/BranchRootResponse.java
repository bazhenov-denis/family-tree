package com.example.backend.tree.dto;

import java.util.UUID;

public class BranchRootResponse {

  private UUID id;
  private UUID personId;
  private String personName;
  private String direction;

  public BranchRootResponse(UUID id, UUID personId, String personName, String direction) {
    this.id = id;
    this.personId = personId;
    this.personName = personName;
    this.direction = direction;
  }

  public UUID getId() { return id; }
  public UUID getPersonId() { return personId; }
  public String getPersonName() { return personName; }
  public String getDirection() { return direction; }
}
