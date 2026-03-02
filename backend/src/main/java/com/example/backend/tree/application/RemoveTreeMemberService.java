package com.example.backend.tree.application;

import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class RemoveTreeMemberService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public RemoveTreeMemberService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
  }

  @Transactional
  public void remove(UUID treeId, UUID targetUserId) {

    User actor = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember actorMember = memberRepository
        .findByTreeAndUser(tree, actor)
        .orElseThrow(() -> new SecurityException("Access denied"));

    // 🔐 только OWNER
    permissionService.checkCanManageMembers(actorMember);

    TreeMember targetMember = memberRepository.findAllByTree(tree).stream()
        .filter(m -> m.getUser().getId().equals(targetUserId))
        .findFirst()
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Member not found"));

    // 🔥 ВСЯ ЛОГИКА В ENTITY
    if (!targetMember.canBeRemovedBy(actor)) {
      throw new IllegalStateException("Member cannot be removed");
    }

    memberRepository.delete(targetMember);
  }
}
