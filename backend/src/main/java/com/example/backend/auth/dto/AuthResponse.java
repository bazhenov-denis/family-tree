package com.example.backend.auth.dto;

public class AuthResponse {

  private String accessToken;
  private String tokenType = "Bearer";
  private String email;
  private String name;

  public AuthResponse(String accessToken) {
    this.accessToken = accessToken;
  }

  public AuthResponse(String accessToken, String email, String name) {
    this.accessToken = accessToken;
    this.email = email;
    this.name = name;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public String getTokenType() {
    return tokenType;
  }

  public String getEmail() {
    return email;
  }

  public String getName() {
    return name;
  }
}
