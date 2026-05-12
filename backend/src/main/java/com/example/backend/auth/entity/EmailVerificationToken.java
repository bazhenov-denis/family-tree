package com.example.backend.auth.entity;

import com.example.backend.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Entity
@Table(name = "email_verification_token")
public class EmailVerificationToken extends BaseEntity {

  private static final SecureRandom RANDOM = new SecureRandom();

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(unique = true, nullable = false, length = 96)
  private String token;

  @Column(nullable = false)
  private Instant expiresAt;

  private boolean used = false;
  private Instant usedAt;

  protected EmailVerificationToken() {
  }

  private EmailVerificationToken(User user, String token, Instant expiresAt) {
    this.user = user;
    this.token = token;
    this.expiresAt = expiresAt;
  }

  public static EmailVerificationToken create(User user, Duration ttl) {
    byte[] bytes = new byte[48];
    RANDOM.nextBytes(bytes);
    return new EmailVerificationToken(
        user,
        Base64.getUrlEncoder().withoutPadding().encodeToString(bytes),
        Instant.now().plus(ttl)
    );
  }

  public void use() {
    if (used) {
      throw new IllegalStateException("Ссылка уже использована");
    }
    if (isExpired()) {
      throw new IllegalStateException("Срок действия ссылки истёк");
    }
    this.used = true;
    this.usedAt = Instant.now();
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public User getUser() {
    return user;
  }

  public String getToken() {
    return token;
  }
}
