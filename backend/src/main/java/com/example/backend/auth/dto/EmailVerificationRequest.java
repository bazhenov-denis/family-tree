package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class EmailVerificationRequest {

  @Email
  @NotBlank
  private String email;

  public String getEmail() {
    return email;
  }
}
