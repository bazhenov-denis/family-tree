package com.example.backend.tree.application;

import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GetTreeService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public GetTreeService(
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

  public TreeResponse get(UUID treeId) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findById(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanView(member);

    return new TreeResponse(
        tree.getId(),
        tree.getTitle(),
        tree.getDescription(),
        tree.getCreatedAt(),
        member.getRole().name()
    );
  }
}

