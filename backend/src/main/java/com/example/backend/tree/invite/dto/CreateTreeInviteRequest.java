package com.example.backend.tree.invite.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public class CreateTreeInviteRequest {

  @Email
  private String email;

  @NotNull
  private String role; // EDITOR / COMMENTATOR / VIEWER

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }
}
