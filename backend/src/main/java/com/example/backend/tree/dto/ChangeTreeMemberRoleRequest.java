package com.example.backend.tree.dto;

import jakarta.validation.constraints.NotNull;

public class ChangeTreeMemberRoleRequest {

  @NotNull
  private String role; // EDITOR / VIEWER

  public String getRole() {
    return role;
  }
}
