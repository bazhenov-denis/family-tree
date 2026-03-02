package com.example.backend.auth.application;

import com.example.backend.auth.dto.UpdateProfileRequest;
import com.example.backend.auth.dto.UserProfileDto;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.repository.UserRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

  private final CurrentUserProvider currentUserProvider;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserProfileService(
      CurrentUserProvider currentUserProvider,
      UserRepository userRepository,
      PasswordEncoder passwordEncoder
  ) {
    this.currentUserProvider = currentUserProvider;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public UserProfileDto getMe() {
    return new UserProfileDto(currentUserProvider.get());
  }

  @Transactional
  public UserProfileDto updateMe(UpdateProfileRequest req) {
    User user = currentUserProvider.get();

    if (req.getName() != null) {
      String trimmed = req.getName().trim();
      user.setName(trimmed.isEmpty() ? null : trimmed);
    }

    String newPwd = req.getNewPassword();
    if (newPwd != null && !newPwd.isEmpty()) {
      if (req.getCurrentPassword() == null
          || !passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
        throw new IllegalArgumentException("Неверный текущий пароль");
      }
      if (newPwd.length() < 6) {
        throw new IllegalArgumentException("Новый пароль должен быть не менее 6 символов");
      }
      user.setPasswordHash(passwordEncoder.encode(newPwd));
    }

    userRepository.save(user);
    return new UserProfileDto(user);
  }
}
