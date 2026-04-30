package com.example.backend.tree.api;

import com.example.backend.tree.domain.BranchPermissionService;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.BranchRootRequest;
import com.example.backend.tree.dto.BranchRootResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/members/{memberId}/branches")
public class BranchPermissionController {

  private final BranchPermissionService branchPermissionService;
  private final TreePermissionService permissionService;
  private final TreeMemberRepository memberRepository;
  private final FamilyTreeRepository treeRepository;
  private final CurrentUserProvider currentUserProvider;

  public BranchPermissionController(
      BranchPermissionService branchPermissionService,
      TreePermissionService permissionService,
      TreeMemberRepository memberRepository,
      FamilyTreeRepository treeRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.branchPermissionService = branchPermissionService;
    this.permissionService = permissionService;
    this.memberRepository = memberRepository;
    this.treeRepository = treeRepository;
    this.currentUserProvider = currentUserProvider;
  }

  @GetMapping
  public List<BranchRootResponse> getBranches(
      @PathVariable UUID treeId,
      @PathVariable UUID memberId
  ) {
    return branchPermissionService.getBranchRoots(memberId);
  }

  @PutMapping
  public List<BranchRootResponse> setBranches(
      @PathVariable UUID treeId,
      @PathVariable UUID memberId,
      @RequestBody @Valid List<BranchRootRequest> requests
  ) {
    User currentUser = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));
    TreeMember actor = memberRepository.findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));
    permissionService.checkCanManageMembers(actor);

    branchPermissionService.setBranchRoots(memberId, requests);
    return branchPermissionService.getBranchRoots(memberId);
  }

  @DeleteMapping("/{branchId}")
  public void deleteBranch(
      @PathVariable UUID treeId,
      @PathVariable UUID memberId,
      @PathVariable UUID branchId
  ) {
    User currentUser = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));
    TreeMember actor = memberRepository.findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));
    permissionService.checkCanManageMembers(actor);

    branchPermissionService.getBranchRoots(memberId).stream()
        .filter(b -> b.getId().equals(branchId))
        .findFirst()
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Branch not found"));

    branchPermissionService.setBranchRoots(memberId,
        branchPermissionService.getBranchRoots(memberId).stream()
            .filter(b -> !b.getId().equals(branchId))
            .map(b -> {
              BranchRootRequest req = new BranchRootRequest();
              req.setPersonId(b.getPersonId());
              req.setDirection(b.getDirection());
              return req;
            })
            .toList());
  }
}
