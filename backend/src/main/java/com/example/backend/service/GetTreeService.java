package com.example.backend.service;

import com.example.backend.dto.tree.TreeResponse;
import com.example.backend.entity.FamilyTree;
import com.example.backend.entity.TreeMember;
import com.example.backend.entity.User;
import com.example.backend.repository.FamilyTreeRepository;
import com.example.backend.repository.TreeMemberRepository;
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
        .orElseThrow(() -> new IllegalArgumentException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, (org.apache.catalina.User) currentUser)
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

