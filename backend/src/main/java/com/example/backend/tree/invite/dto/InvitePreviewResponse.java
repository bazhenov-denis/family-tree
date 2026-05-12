package com.example.backend.tree.invite.dto;

public class InvitePreviewResponse {
  private String treeTitle;
  private String role;
  private String email;

  public InvitePreviewResponse(String treeTitle, String role, String email) {
    this.treeTitle = treeTitle;
    this.role = role;
    this.email = email;
  }

  public String getTreeTitle() {
    return treeTitle;
  }

  public String getRole() {
    return role;
  }

  public String getEmail() {
    return email;
  }
}
