package com.example.backend.tree.application;

import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.TreeMemberResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class GetTreeMembersService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public GetTreeMembersService(
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

  public List<TreeMemberResponse> list(UUID treeId) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember requester = memberRepository
        .findByTreeAndUser(tree,currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanViewMembers(requester);

    return memberRepository.findAllByTree(tree).stream()
        // для UI: OWNER сверху, потом EDITOR, потом VIEWER
        .sorted(Comparator.comparing(
            (TreeMember m) -> m.getRole().ordinal()
        ))
        .map(this::toResponse)
        .toList();
  }

  private TreeMemberResponse toResponse(TreeMember member) {
    return new TreeMemberResponse(
        member.getUser().getId(),
        member.getUser().getEmail(),
        member.getRole().name()
    );
  }
}

