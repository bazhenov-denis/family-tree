package com.example.backend.auth.dto;

import com.example.backend.auth.entity.User;
import java.util.UUID;

public class UserProfileDto {

  private final UUID id;
  private final String email;
  private final String name;
  private final boolean emailVerified;

  public UserProfileDto(User user) {
    this.id    = user.getId();
    this.email = user.getEmail();
    this.name  = user.getName();
    this.emailVerified = user.isEmailVerified();
  }

  public UUID getId()    { return id;    }
  public String getEmail() { return email; }
  public String getName()  { return name;  }
  public boolean isEmailVerified() { return emailVerified; }
}
