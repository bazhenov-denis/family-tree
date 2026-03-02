package com.example.backend.tree.application;

import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.dto.UpdateTreeRequest;
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
public class UpdateTreeService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public UpdateTreeService(
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
  public TreeResponse update(UUID treeId, UpdateTreeRequest request) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findById(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    // 🔐 ТОЛЬКО OWNER
    permissionService.checkCanManage(member);

    tree.update(
        request.getTitle(),
        request.getDescription()
    );

    return new TreeResponse(
        tree.getId(),
        tree.getTitle(),
        tree.getDescription(),
        tree.getCreatedAt(),
        member.getRole().name()
    );
  }
}
