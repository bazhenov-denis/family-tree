package com.example.backend.security;

import com.example.backend.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextCurrentUserProvider implements CurrentUserProvider {

  @Override
  public User get() {
    Object principal =
        SecurityContextHolder.getContext()
            .getAuthentication()
            .getPrincipal();

    return (User) principal;
  }
}
