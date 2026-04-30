package com.example.backend.tree.invite.application;

import com.example.backend.auth.entity.User;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.invite.entity.InviteStatus;
import com.example.backend.tree.invite.entity.TreeInvite;
import com.example.backend.tree.invite.repository.TreeInviteRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AcceptTreeInviteService {

  private final TreeInviteRepository inviteRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;

  public AcceptTreeInviteService(
      TreeInviteRepository inviteRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.inviteRepository = inviteRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
  }

  @Transactional
  public void accept(UUID inviteId) {

    User currentUser = currentUserProvider.get();

    TreeInvite invite = inviteRepository
        .findByIdAndStatus(inviteId, InviteStatus.PENDING)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Invite not found"));

    // 🔥 ВСЯ ЛОГИКА ЗДЕСЬ
    invite.acceptBy(currentUser);

    // защита от дублей (если приняли повторно)
    boolean alreadyMember = memberRepository.existsByTreeAndUser(
        invite.getTree(),
         currentUser
    );

    if (!alreadyMember) {
      TreeMember member = switch (invite.getRole()) {
        case EDITOR -> TreeMember.editor(invite.getTree(), currentUser);
        case COMMENTATOR -> TreeMember.commentator(invite.getTree(), currentUser);
        case VIEWER -> TreeMember.viewer(invite.getTree(), currentUser);
        default -> throw new IllegalStateException("Invalid invite role");
      };

      memberRepository.save(member);
    }
  }
}
