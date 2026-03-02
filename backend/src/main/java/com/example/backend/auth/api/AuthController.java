package com.example.backend.auth.api;


import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.LoginUserRequest;
import com.example.backend.auth.dto.RegisterUserRequest;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.application.LoginUserService;
import com.example.backend.auth.application.RegisterUserService;
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
