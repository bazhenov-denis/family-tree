package com.example.backend.service;

import com.example.backend.dto.tree.AddTreeMemberRequest;
import com.example.backend.dto.tree.TreeMemberResponse;
import com.example.backend.entity.FamilyTree;
import com.example.backend.entity.TreeMember;
import com.example.backend.entity.User;
import com.example.backend.enums.TreeRole;
import com.example.backend.repository.FamilyTreeRepository;
import com.example.backend.repository.TreeMemberRepository;
import com.example.backend.repository.UserRepository;
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
        .orElseThrow(() -> new IllegalArgumentException("Tree not found"));

    TreeMember owner = memberRepository
        .findByTreeAndUser(tree, (org.apache.catalina.User) currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanManageMembers(owner);

    User userToAdd = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (memberRepository.existsByTreeAndUser(tree, (org.apache.catalina.User) userToAdd)) {
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
