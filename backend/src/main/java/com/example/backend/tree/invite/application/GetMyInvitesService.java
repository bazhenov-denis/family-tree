package com.example.backend.tree.invite.application;

import com.example.backend.auth.entity.User;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.invite.dto.TreeInviteResponse;
import com.example.backend.tree.invite.entity.InviteStatus;
import com.example.backend.tree.invite.repository.TreeInviteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetMyInvitesService {

  private final TreeInviteRepository inviteRepository;
  private final CurrentUserProvider currentUserProvider;

  public GetMyInvitesService(
      TreeInviteRepository inviteRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.inviteRepository = inviteRepository;
    this.currentUserProvider = currentUserProvider;
  }

  public List<TreeInviteResponse> getMyInvites() {

    User currentUser = currentUserProvider.get();

    return inviteRepository
        .findAllByEmailAndStatus(
            currentUser.getEmail(),
            InviteStatus.PENDING
        )
        .stream()
        .map(invite -> new TreeInviteResponse(
            invite.getId(),
            invite.getTree().getId(),
            invite.getTree().getTitle(),
            invite.getRole().name(),
            invite.getExpiresAt()
        ))
        .toList();
  }
}
