package com.example.backend.tree.invite.application;


import com.example.backend.auth.entity.User;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.invite.entity.InviteStatus;
import com.example.backend.tree.invite.entity.TreeInvite;
import com.example.backend.tree.invite.repository.TreeInviteRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DeclineTreeInviteService {

  private final TreeInviteRepository inviteRepository;
  private final CurrentUserProvider currentUserProvider;

  public DeclineTreeInviteService(
      TreeInviteRepository inviteRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.inviteRepository = inviteRepository;
    this.currentUserProvider = currentUserProvider;
  }

  @Transactional
  public void decline(UUID inviteId) {

    User currentUser = currentUserProvider.get();

    TreeInvite invite = inviteRepository
        .findByIdAndStatus(inviteId, InviteStatus.PENDING)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Invite not found"));

    // 🔥 ВСЯ БИЗНЕС-ЛОГИКА ЗДЕСЬ
    invite.declineBy(currentUser);
  }
}
