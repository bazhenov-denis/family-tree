package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterUserRequest {

  @Email
  @NotBlank
  private String email;

  @NotBlank
  @Size(min = 6, max = 100)
  private String password;

  private String name;
  private String redirectPath;

  public String getEmail() {
    return email;
  }

  public String getPassword() {
    return password;
  }

  public String getName() {
    return name;
  }

  public String getRedirectPath() {
    return redirectPath;
  }
}
