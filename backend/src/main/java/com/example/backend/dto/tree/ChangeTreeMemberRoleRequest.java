package com.example.backend.dto.tree;

import jakarta.validation.constraints.NotNull;

public class ChangeTreeMemberRoleRequest {

  @NotNull
  private String role; // EDITOR / VIEWER

  public String getRole() {
    return role;
  }
}
