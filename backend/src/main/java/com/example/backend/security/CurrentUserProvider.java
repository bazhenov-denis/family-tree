package com.example.backend.security;

import com.example.backend.entity.User;

public interface CurrentUserProvider {
  User get();
}
