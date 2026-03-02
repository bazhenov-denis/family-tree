package com.example.backend.auth.application;

import com.example.backend.auth.dto.RegisterUserRequest;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RegisterUserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public RegisterUserService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public User register(RegisterUserRequest request) {

    String email = request.getEmail().toLowerCase();

    if (userRepository.existsByEmail(email)) {
      throw new IllegalArgumentException("Email already registered");
    }

    User user = new User();
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setName(request.getName());

    return userRepository.save(user);
  }
}
