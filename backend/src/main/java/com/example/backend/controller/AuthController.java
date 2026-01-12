package com.example.backend.controller;


import com.example.backend.dto.auth.AuthResponse;
import com.example.backend.dto.auth.LoginUserRequest;
import com.example.backend.dto.auth.RegisterUserRequest;
import com.example.backend.entity.User;
import com.example.backend.service.LoginUserService;
import com.example.backend.service.RegisterUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final RegisterUserService registerUserService;
  private final LoginUserService loginUserService;

  public AuthController(RegisterUserService registerUserService, LoginUserService loginUserService) {
    this.registerUserService = registerUserService;
    this.loginUserService = loginUserService;
  }

  @PostMapping("/register")
  public User register(@RequestBody @Valid RegisterUserRequest request) {
    return registerUserService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody @Valid LoginUserRequest request) {
    return loginUserService.login(request);
  }
}
