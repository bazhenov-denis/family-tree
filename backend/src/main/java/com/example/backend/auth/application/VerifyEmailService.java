package com.example.backend.auth.application;

import com.example.backend.auth.entity.EmailVerificationToken;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.EmailVerificationTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class VerifyEmailService {

  private final EmailVerificationTokenRepository tokenRepository;

  public VerifyEmailService(EmailVerificationTokenRepository tokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  @Transactional
  public User verify(String tokenValue) {
    EmailVerificationToken token = tokenRepository
        .findByTokenAndUsedFalse(tokenValue)
        .orElseThrow(() -> new IllegalArgumentException("Ссылка подтверждения недействительна"));

    token.use();

    User user = token.getUser();
    if (!user.isEmailVerified()) {
      user.markEmailVerified();
    }

    return user;
  }
}
