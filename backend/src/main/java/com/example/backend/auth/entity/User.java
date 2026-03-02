package com.example.backend.auth.entity;

import com.example.backend.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

  @Column(unique = true, nullable = false)
  private String email;

  private String passwordHash;
  private String name;

  public User(String email, String passwordHash, String name) {
    this.email = email;
    this.passwordHash = passwordHash;
    this.name = name;
  }

  public User() {
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
