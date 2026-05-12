package com.example.backend.auth.dto;

public class RegisterResponse {
  private final String email;
  private final boolean emailVerified;
  private final String message;

  public RegisterResponse(String email, boolean emailVerified, String message) {
    this.email = email;
    this.emailVerified = emailVerified;
    this.message = message;
  }

  public String getEmail() {
    return email;
  }

  public boolean isEmailVerified() {
    return emailVerified;
  }

  public String getMessage() {
    return message;
  }
}
