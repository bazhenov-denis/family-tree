package com.example.backend.tree.invite.api;

import com.example.backend.auth.entity.User;
import com.example.backend.tree.invite.application.AcceptInviteByTokenService;
import com.example.backend.tree.invite.application.ResolveInviteTokenService;
import com.example.backend.tree.invite.dto.InvitePreviewResponse;
import com.example.backend.tree.invite.entity.TreeInvite;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/invites")
public class InviteTokenController {

  private final ResolveInviteTokenService resolveService;
  private final AcceptInviteByTokenService acceptService;

  public InviteTokenController(
      ResolveInviteTokenService resolveService,
      AcceptInviteByTokenService acceptService
  ) {
    this.resolveService = resolveService;
    this.acceptService = acceptService;
  }

  @GetMapping("/{token}")
  public InvitePreviewResponse resolve(@PathVariable String token) {

    TreeInvite invite = resolveService.resolve(token);

    return new InvitePreviewResponse(
        invite.getTree().getTitle(),
        invite.getRole().name(),
        invite.getEmail()
    );
  }

  @PostMapping("/{token}/accept")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void accept(@PathVariable String token, Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
      throw new SecurityException("Unauthorized");
    }

    acceptService.accept(token, user);
  }
}
