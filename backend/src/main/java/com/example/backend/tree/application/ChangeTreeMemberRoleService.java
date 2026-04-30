package com.example.backend.tree.application;

import com.example.backend.tree.domain.BranchPermissionService;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.ChangeTreeMemberRoleRequest;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.entity.TreeRole;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ChangeTreeMemberRoleService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final BranchPermissionService branchPermissionService;

  public ChangeTreeMemberRoleService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      BranchPermissionService branchPermissionService
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.branchPermissionService = branchPermissionService;
  }

  @Transactional
  public void changeRole(
      UUID treeId,
      UUID targetUserId,
      ChangeTreeMemberRoleRequest request
  ) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember actor = memberRepository
        .findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    // 🔐 только OWNER
    permissionService.checkCanManageMembers(actor);

    TreeMember targetMember = memberRepository.findAllByTree(tree).stream()
        .filter(m -> m.getUser().getId().equals(targetUserId))
        .findFirst()
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Member not found"));

    TreeRole newRole;
    try {
      newRole = TreeRole.valueOf(request.getRole());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid role");
    }

    // 🔥 ВСЯ БИЗНЕС-ЛОГИКА ЗДЕСЬ
    targetMember.changeRole(newRole);

    // Clear branch permissions if changing away from EDITOR
    if (newRole != TreeRole.EDITOR) {
      branchPermissionService.setBranchRoots(targetMember.getId(), java.util.List.of());
    }
  }
}
