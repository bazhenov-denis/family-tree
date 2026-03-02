package com.example.backend.tree.invite.application;

import com.example.backend.auth.entity.User;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.entity.TreeRole;
import com.example.backend.tree.invite.dto.CreateTreeInviteRequest;
import com.example.backend.tree.invite.entity.InviteStatus;
import com.example.backend.tree.invite.entity.TreeInvite;
import com.example.backend.tree.invite.repository.TreeInviteRepository;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CreateTreeInviteService {

  private static final Logger log = LoggerFactory.getLogger(CreateTreeInviteService.class);

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final TreeInviteRepository inviteRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final SendInviteEmailService sendInviteEmailService;

  public CreateTreeInviteService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      TreeInviteRepository inviteRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      SendInviteEmailService sendInviteEmailService
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.inviteRepository = inviteRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.sendInviteEmailService = sendInviteEmailService;
  }

  @Transactional
  public void create(UUID treeId, CreateTreeInviteRequest request) {

    User owner = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, owner)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanManageMembers(member);

    if (inviteRepository.existsByTreeAndEmailAndStatus(
        tree,
        request.getEmail(),
        InviteStatus.PENDING
    )) {
      throw new IllegalStateException("Приглашение уже отправлено на этот адрес");
    }

    TreeRole role = TreeRole.valueOf(request.getRole());

    TreeInvite invite = TreeInvite.create(
        tree,
        owner,
        request.getEmail(),
        role,
        Duration.ofDays(7)
    );

    inviteRepository.save(invite);

    try {
      sendInviteEmailService.send(invite);
    } catch (Exception e) {
      log.error("Failed to send invite email to {}: {}", request.getEmail(), e.getMessage());
    }
  }
}
