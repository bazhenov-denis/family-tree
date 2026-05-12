package com.example.backend.auth.application;

import com.example.backend.auth.dto.RegisterUserRequest;
import com.example.backend.auth.dto.RegisterResponse;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RegisterUserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final SendEmailVerificationService sendEmailVerificationService;

  public RegisterUserService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      SendEmailVerificationService sendEmailVerificationService
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.sendEmailVerificationService = sendEmailVerificationService;
  }

  @Transactional
  public RegisterResponse register(RegisterUserRequest request) {

    String email = request.getEmail().trim().toLowerCase();

    if (userRepository.existsByEmail(email)) {
      throw new IllegalArgumentException("Email уже зарегистрирован");
    }

    User user = new User();
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setName(request.getName());

    User savedUser = userRepository.save(user);
    sendEmailVerificationService.send(savedUser, request.getRedirectPath());

    return new RegisterResponse(
        savedUser.getEmail(),
        savedUser.isEmailVerified(),
        "Мы отправили письмо со ссылкой для подтверждения email"
    );
  }
}
