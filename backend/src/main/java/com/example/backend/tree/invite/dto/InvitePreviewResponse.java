package com.example.backend.tree.invite.dto;

public class InvitePreviewResponse {
  private String treeTitle;
  private String role;

  public InvitePreviewResponse(String treeTitle, String role) {
    this.treeTitle = treeTitle;
    this.role = role;
  }
}
