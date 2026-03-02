package com.example.backend.auth.repository;

import com.example.backend.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);

}
