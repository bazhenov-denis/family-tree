package com.example.backend.tree.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateTreeRequest {

  @NotBlank
  private String title;

  private String description;

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }
}
