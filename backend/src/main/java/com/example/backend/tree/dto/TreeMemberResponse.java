package com.example.backend.tree.dto;

import java.util.UUID;

public class TreeMemberResponse {

  private UUID memberId;
  private UUID userId;
  private String email;
  private String role;

  public TreeMemberResponse(UUID memberId, UUID userId, String email, String role) {
    this.memberId = memberId;
    this.userId = userId;
    this.email = email;
    this.role = role;
  }

  public UUID getMemberId() {
    return memberId;
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
