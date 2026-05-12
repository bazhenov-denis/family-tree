package com.example.backend.auth.application;

import com.example.backend.auth.entity.EmailVerificationToken;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.EmailVerificationTokenRepository;
import com.example.backend.shared.email.EmailSender;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SendEmailVerificationService {

  private static final Logger log = LoggerFactory.getLogger(SendEmailVerificationService.class);

  private final EmailVerificationTokenRepository tokenRepository;
  private final EmailSender emailSender;
  private final String appUrl;

  public SendEmailVerificationService(
      EmailVerificationTokenRepository tokenRepository,
      EmailSender emailSender,
      @Value("${app.url}") String appUrl
  ) {
    this.tokenRepository = tokenRepository;
    this.emailSender = emailSender;
    this.appUrl = appUrl;
  }

  @Transactional
  public void send(User user) {
    send(user, null);
  }

  @Transactional
  public void send(User user, String redirectPath) {
    if (user.isEmailVerified()) {
      return;
    }

    tokenRepository.deleteByUserAndUsedFalse(user);
    EmailVerificationToken token = EmailVerificationToken.create(user, Duration.ofHours(24));
    tokenRepository.save(token);

    String link = appUrl + "/verify-email?token=" + token.getToken();
    String safeRedirect = safeRedirectPath(redirectPath);
    if (safeRedirect != null) {
      link += "&redirect=" + URLEncoder.encode(safeRedirect, StandardCharsets.UTF_8);
    }
    log.info("Email verification link for {}: {}", user.getEmail(), link);

    String body = """
        Подтвердите email для аккаунта в сервисе "Семейное Древо".

        Перейти по ссылке:
        %s

        Ссылка действует 24 часа. Если вы не регистрировались, просто проигнорируйте это письмо.
        """.formatted(link);

    try {
      emailSender.send(user.getEmail(), "Подтверждение email", body);
    } catch (Exception e) {
      log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
    }
  }

  private String safeRedirectPath(String redirectPath) {
    if (redirectPath == null || redirectPath.isBlank()) {
      return null;
    }

    String trimmed = redirectPath.trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.contains("://")) {
      return null;
    }

    return trimmed;
  }
}
