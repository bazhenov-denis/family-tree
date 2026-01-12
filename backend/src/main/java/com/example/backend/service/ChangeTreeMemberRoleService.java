package com.example.backend.service;

import com.example.backend.dto.tree.ChangeTreeMemberRoleRequest;
import com.example.backend.entity.FamilyTree;
import com.example.backend.entity.TreeMember;
import com.example.backend.entity.User;
import com.example.backend.enums.TreeRole;
import com.example.backend.repository.FamilyTreeRepository;
import com.example.backend.repository.TreeMemberRepository;
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

  public ChangeTreeMemberRoleService(
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
  public void changeRole(
      UUID treeId,
      UUID targetUserId,
      ChangeTreeMemberRoleRequest request
  ) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new IllegalArgumentException("Tree not found"));

    TreeMember actor = memberRepository
        .findByTreeAndUser(tree, (org.apache.catalina.User) currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    // 🔐 только OWNER
    permissionService.checkCanManageMembers(actor);

    TreeMember targetMember = memberRepository.findAllByTree(tree).stream()
        .filter(m -> m.getUser().getId().equals(targetUserId))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Member not found"));

    TreeRole newRole;
    try {
      newRole = TreeRole.valueOf(request.getRole());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid role");
    }

    // 🔥 ВСЯ БИЗНЕС-ЛОГИКА ЗДЕСЬ
    targetMember.changeRole(newRole);
  }
}
