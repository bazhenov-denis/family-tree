package com.example.backend.auth.api;


import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.EmailVerificationRequest;
import com.example.backend.auth.dto.LoginUserRequest;
import com.example.backend.auth.dto.MessageResponse;
import com.example.backend.auth.dto.RegisterUserRequest;
import com.example.backend.auth.entity.User;
import com.example.backend.auth.application.LoginUserService;
import com.example.backend.auth.application.ResendEmailVerificationService;
import com.example.backend.auth.application.RegisterUserService;
import com.example.backend.auth.application.VerifyEmailService;
import com.example.backend.auth.dto.RegisterResponse;
import com.example.backend.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final RegisterUserService registerUserService;
  private final LoginUserService loginUserService;
  private final VerifyEmailService verifyEmailService;
  private final ResendEmailVerificationService resendEmailVerificationService;
  private final JwtTokenProvider tokenProvider;

  public AuthController(
      RegisterUserService registerUserService,
      LoginUserService loginUserService,
      VerifyEmailService verifyEmailService,
      ResendEmailVerificationService resendEmailVerificationService,
      JwtTokenProvider tokenProvider
  ) {
    this.registerUserService = registerUserService;
    this.loginUserService = loginUserService;
    this.verifyEmailService = verifyEmailService;
    this.resendEmailVerificationService = resendEmailVerificationService;
    this.tokenProvider = tokenProvider;
  }

  @PostMapping("/register")
  public RegisterResponse register(@RequestBody @Valid RegisterUserRequest request) {
    return registerUserService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody @Valid LoginUserRequest request) {
    return loginUserService.login(request);
  }

  @GetMapping("/verify-email")
  public AuthResponse verifyEmail(@RequestParam String token) {
    User user = verifyEmailService.verify(token);
    return new AuthResponse(tokenProvider.generateToken(user), user.getEmail(), user.getName());
  }

  @PostMapping("/resend-verification")
  public MessageResponse resendVerification(@RequestBody @Valid EmailVerificationRequest request) {
    resendEmailVerificationService.resend(request.getEmail());
    return new MessageResponse("Если аккаунт ожидает подтверждения, мы отправили новое письмо");
  }
}
