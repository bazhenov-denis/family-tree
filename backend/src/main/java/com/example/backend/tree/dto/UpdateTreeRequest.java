package com.example.backend.tree.dto;

import jakarta.validation.constraints.Size;

public class UpdateTreeRequest {

  @Size(max = 255)
  private String title;

  @Size(max = 1000)
  private String description;

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }
}
