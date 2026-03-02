package com.example.backend.tree.invite.api;

import com.example.backend.tree.invite.application.ResolveInviteTokenService;
import com.example.backend.tree.invite.dto.InvitePreviewResponse;
import com.example.backend.tree.invite.entity.TreeInvite;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invites")
public class InviteTokenController {

  private final ResolveInviteTokenService resolveService;

  public InviteTokenController(ResolveInviteTokenService resolveService) {
    this.resolveService = resolveService;
  }

  @GetMapping("/{token}")
  public InvitePreviewResponse resolve(@PathVariable String token) {

    TreeInvite invite = resolveService.resolve(token);

    return new InvitePreviewResponse(
        invite.getTree().getTitle(),
        invite.getRole().name()
    );
  }
}
