package com.example.backend.security;

import com.example.backend.auth.entity.User;

public interface CurrentUserProvider {
  User get();
}
