package com.example.backend.dto.tree;

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
