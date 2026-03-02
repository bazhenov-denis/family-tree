package com.example.backend.auth.api;

import com.example.backend.auth.application.UserProfileService;
import com.example.backend.auth.dto.UpdateProfileRequest;
import com.example.backend.auth.dto.UserProfileDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

  private final UserProfileService userProfileService;

  public UserProfileController(UserProfileService userProfileService) {
    this.userProfileService = userProfileService;
  }

  @GetMapping("/me")
  public UserProfileDto getMe() {
    return userProfileService.getMe();
  }

  @PatchMapping("/me")
  public UserProfileDto updateMe(@RequestBody UpdateProfileRequest req) {
    return userProfileService.updateMe(req);
  }
}
