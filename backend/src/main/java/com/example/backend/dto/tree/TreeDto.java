package com.example.backend.dto.tree;

public class TreeDto {

  private String id;
  private String title;
  private String role;

  public TreeDto(String id, String title, String role) {
    this.id = id;
    this.title = title;
    this.role = role;
  }

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getRole() {
    return role;
  }
}
