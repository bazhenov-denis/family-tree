package com.example.backend.dto.tree;

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
