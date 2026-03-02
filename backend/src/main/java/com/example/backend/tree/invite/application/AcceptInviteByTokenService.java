package com.example.backend.tree.invite.application;

import com.example.backend.auth.entity.User;
import com.example.backend.tree.invite.entity.InviteToken;
import com.example.backend.tree.invite.repository.InviteTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class AcceptInviteByTokenService {

  private final InviteTokenRepository tokenRepository;
  private final AcceptTreeInviteService acceptInviteService;

  public AcceptInviteByTokenService(InviteTokenRepository tokenRepository, AcceptTreeInviteService acceptInviteService) {
    this.tokenRepository = tokenRepository;
    this.acceptInviteService = acceptInviteService;
  }

  @Transactional
  public void accept(String token, User user) {

    InviteToken inviteToken = tokenRepository
        .findByTokenAndUsedFalse(token)
        .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

    if (inviteToken.isExpired()) {
      throw new IllegalStateException("Token expired");
    }

    acceptInviteService.accept(inviteToken.getInvite().getId());

    inviteToken.markUsed();
  }
}
