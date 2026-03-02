package com.example.backend.tree.invite.domain;

import com.example.backend.shared.email.EmailSender;
public class ConsoleEmailSender implements EmailSender {

  @Override
  public void send(String to, String subject, String body) {
    System.out.println("=== EMAIL ===");
    System.out.println("TO: " + to);
    System.out.println("SUBJECT: " + subject);
    System.out.println(body);
  }
}
