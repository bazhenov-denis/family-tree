package com.example.backend.dto.tree;

import java.util.UUID;

public class TreeMemberResponse {

  private UUID userId;
  private String email;
  private String role;

  public TreeMemberResponse(UUID userId, String email, String role) {
    this.userId = userId;
    this.email = email;
    this.role = role;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getEmail() {
    return email;
  }

  public String getRole() {
    return role;
  }
}
