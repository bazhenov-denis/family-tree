package com.example.backend.tree.invite.entity;

import com.example.backend.auth.entity.User;
import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;

@Entity
@Table(name = "tree_invite")
public class TreeInvite extends BaseEntity {

  @ManyToOne(optional = false)
  private FamilyTree tree;

  @ManyToOne(optional = false)
  private User invitedBy; // OWNER

  @Column(nullable = false)
  private String email;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TreeRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InviteStatus status;

  @Column(nullable = false)
  private Instant expiresAt;

  protected TreeInvite() {}

  private TreeInvite(
      FamilyTree tree,
      User invitedBy,
      String email,
      TreeRole role,
      Instant expiresAt
  ) {
    this.tree = tree;
    this.invitedBy = invitedBy;
    this.email = email;
    this.role = role;
    this.expiresAt = expiresAt;
    this.status = InviteStatus.PENDING;
  }

    /* =========================
       FACTORY
       ========================= */

  public static TreeInvite create(
      FamilyTree tree,
      User invitedBy,
      String email,
      TreeRole role,
      Duration ttl
  ) {
    return new TreeInvite(
        tree,
        invitedBy,
        email,
        role,
        Instant.now().plus(ttl)
    );
  }

    /* =========================
       DOMAIN LOGIC
       ========================= */

  public void accept() {
    checkActive();
    this.status = InviteStatus.ACCEPTED;
  }

  public void decline() {
    checkActive();
    this.status = InviteStatus.DECLINED;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  private void checkActive() {
    if (status != InviteStatus.PENDING || isExpired()) {
      throw new IllegalStateException("Invite is not active");
    }
  }

  public void acceptBy(User user) {

    checkActive();

    if (!user.getEmail().equalsIgnoreCase(this.email)) {
      throw new SecurityException("Invite email mismatch");
    }

    this.status = InviteStatus.ACCEPTED;
  }

  public void declineBy(User user) {

    checkActive();

    if (!user.getEmail().equalsIgnoreCase(this.email)) {
      throw new SecurityException("Invite email mismatch");
    }

    this.status = InviteStatus.DECLINED;
  }

    /* =========================
       GETTERS
       ========================= */

  public String getEmail() {
    return email;
  }

  public TreeRole getRole() {
    return role;
  }

  public FamilyTree getTree() {
    return tree;
  }

  public InviteStatus getStatus() {
    return status;
  }

  public void setTree(FamilyTree tree) {
    this.tree = tree;
  }

  public User getInvitedBy() {
    return invitedBy;
  }

  public void setInvitedBy(User invitedBy) {
    this.invitedBy = invitedBy;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setRole(TreeRole role) {
    this.role = role;
  }

  public void setStatus(InviteStatus status) {
    this.status = status;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }
}
