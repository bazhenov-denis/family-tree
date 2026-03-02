package com.example.backend.shared.email;

public interface EmailSender {
  void send(String to, String subject, String body);
}

