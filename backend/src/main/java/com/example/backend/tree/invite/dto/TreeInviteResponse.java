package com.example.backend.tree.invite.dto;

import java.time.Instant;
import java.util.UUID;

public class TreeInviteResponse {

  private UUID inviteId;
  private UUID treeId;
  private String treeTitle;
  private String role;
  private Instant expiresAt;

  public TreeInviteResponse(
      UUID inviteId,
      UUID treeId,
      String treeTitle,
      String role,
      Instant expiresAt
  ) {
    this.inviteId = inviteId;
    this.treeId = treeId;
    this.treeTitle = treeTitle;
    this.role = role;
    this.expiresAt = expiresAt;
  }

  public UUID getInviteId() {
    return inviteId;
  }

  public UUID getTreeId() {
    return treeId;
  }

  public String getTreeTitle() {
    return treeTitle;
  }

  public String getRole() {
    return role;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }
}
