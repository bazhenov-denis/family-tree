package com.example.backend.tree.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class BranchRootRequest {

  @NotNull
  private UUID personId;

  @NotNull
  private String direction; // DESCENDANTS / ANCESTORS

  public UUID getPersonId() {
    return personId;
  }

  public void setPersonId(UUID personId) {
    this.personId = personId;
  }

  public String getDirection() {
    return direction;
  }

  public void setDirection(String direction) {
    this.direction = direction;
  }
}
