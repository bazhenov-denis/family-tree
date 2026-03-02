package com.example.backend.tree.application;

import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.AddTreeMemberRequest;
import com.example.backend.tree.dto.TreeMemberResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.entity.TreeRole;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.auth.repository.UserRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AddTreeMemberService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final UserRepository userRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public AddTreeMemberService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      UserRepository userRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.userRepository = userRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
  }

  @Transactional
  public TreeMemberResponse add(UUID treeId, AddTreeMemberRequest request) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember owner = memberRepository
        .findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanManageMembers(owner);

    User userToAdd = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("User not found"));

    if (memberRepository.existsByTreeAndUser(tree, userToAdd)) {
      throw new IllegalStateException("User already member");
    }

    TreeRole role = TreeRole.valueOf(request.getRole());

    TreeMember member = switch (role) {
      case EDITOR -> TreeMember.editor(tree, userToAdd);
      case VIEWER -> TreeMember.viewer(tree, userToAdd);
      default -> throw new IllegalArgumentException("Invalid role");
    };

    memberRepository.save(member);

    return new TreeMemberResponse(
        userToAdd.getId(),
        userToAdd.getEmail(),
        member.getRole().name()
    );
  }
}
