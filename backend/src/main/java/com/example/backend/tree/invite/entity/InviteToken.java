package com.example.backend.tree.invite.entity;

import com.example.backend.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invite_token")
public class InviteToken extends BaseEntity {

  @ManyToOne(optional = false)
  private TreeInvite invite;

  @Column(nullable = false, unique = true)
  private String token;

  @Column(nullable = false)
  private Instant expiresAt;

  @Column(nullable = false)
  private boolean used = false;

  protected InviteToken() {}

  private InviteToken(TreeInvite invite, String token, Instant expiresAt) {
    this.invite = invite;
    this.token = token;
    this.expiresAt = expiresAt;
  }

  public static InviteToken create(TreeInvite invite, Duration ttl) {
    return new InviteToken(
        invite,
        UUID.randomUUID().toString(),
        Instant.now().plus(ttl)
    );
  }

  public void markUsed() {
    if (used) {
      throw new IllegalStateException("Token already used");
    }
    this.used = true;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public TreeInvite getInvite() {
    return invite;
  }

  public String getToken() {
    return token;
  }
}
