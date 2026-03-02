package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginUserRequest {

  @Email
  @NotBlank
  private String email;

  @NotBlank
  private String password;

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }
}
