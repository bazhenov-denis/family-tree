package com.example.backend.shared.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SmtpEmailSender implements EmailSender {

  private final JavaMailSender mailSender;
  private final String from;

  public SmtpEmailSender(
      JavaMailSender mailSender,
      @Value("${spring.mail.username}") String from
  ) {
    this.mailSender = mailSender;
    this.from = from;
  }

  @Override
  public void send(String to, String subject, String body) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(to);
    message.setSubject(subject);
    message.setText(body);
    mailSender.send(message);
  }
}
