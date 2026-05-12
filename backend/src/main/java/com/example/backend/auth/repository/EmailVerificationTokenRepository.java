package com.example.backend.auth.repository;

import com.example.backend.auth.entity.EmailVerificationToken;
import com.example.backend.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
  Optional<EmailVerificationToken> findByTokenAndUsedFalse(String token);

  void deleteByUserAndUsedFalse(User user);
}
