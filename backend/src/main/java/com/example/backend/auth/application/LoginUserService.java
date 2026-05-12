package com.example.backend.auth.application;

import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.LoginUserRequest;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginUserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider tokenProvider;

  public LoginUserService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtTokenProvider tokenProvider
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.tokenProvider = tokenProvider;
  }

  public AuthResponse login(LoginUserRequest request) {

    User user = userRepository.findByEmail(request.getEmail().toLowerCase())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));


    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    if (!user.isEmailVerified()) {
      throw new IllegalStateException("Подтвердите email перед входом");
    }

    String token = tokenProvider.generateToken(user);
    return new AuthResponse(token);
  }
}
