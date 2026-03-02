package com.example.backend.tree.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public class AddTreeMemberRequest {

  @Email
  private String email;

  @NotNull
  private String role; // EDITOR / VIEWER

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }
}
