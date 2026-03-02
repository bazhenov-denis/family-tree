package com.example.backend.shared.exception;

import java.time.Instant;

public class ErrorResponse {

  private final int status;
  private final String message;
  private final Instant timestamp = Instant.now();

  public ErrorResponse(int status, String message) {
    this.status = status;
    this.message = message;
  }

  public int getStatus() { return status; }
  public String getMessage() { return message; }
  public Instant getTimestamp() { return timestamp; }
}
