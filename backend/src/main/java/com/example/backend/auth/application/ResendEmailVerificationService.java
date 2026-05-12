package com.example.backend.auth.application;

import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class ResendEmailVerificationService {

  private final UserRepository userRepository;
  private final SendEmailVerificationService sendEmailVerificationService;

  public ResendEmailVerificationService(
      UserRepository userRepository,
      SendEmailVerificationService sendEmailVerificationService
  ) {
    this.userRepository = userRepository;
    this.sendEmailVerificationService = sendEmailVerificationService;
  }

  public void resend(String email) {
    userRepository.findByEmail(email.toLowerCase())
        .filter(user -> !user.isEmailVerified())
        .ifPresent(sendEmailVerificationService::send);
  }
}
