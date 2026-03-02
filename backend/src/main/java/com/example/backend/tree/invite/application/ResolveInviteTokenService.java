package com.example.backend.tree.invite.application;

import com.example.backend.tree.invite.entity.InviteToken;
import com.example.backend.tree.invite.entity.TreeInvite;
import com.example.backend.tree.invite.repository.InviteTokenRepository;
import org.springframework.stereotype.Service;

@Service
public class ResolveInviteTokenService {

  private final InviteTokenRepository tokenRepository;

  public ResolveInviteTokenService(InviteTokenRepository tokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  public TreeInvite resolve(String token) {

    InviteToken inviteToken = tokenRepository
        .findByTokenAndUsedFalse(token)
        .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

    if (inviteToken.isExpired()) {
      throw new IllegalStateException("Token expired");
    }

    return inviteToken.getInvite();
  }
}
