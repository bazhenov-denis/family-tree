package com.example.backend.tree.domain;

import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.entity.Relationship;
import com.example.backend.relationship.entity.RelationshipType;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.tree.dto.BranchRootRequest;
import com.example.backend.tree.dto.BranchRootResponse;
import com.example.backend.tree.entity.BranchDirection;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.entity.TreeMemberBranchPermission;
import com.example.backend.tree.entity.TreeRole;
import com.example.backend.tree.repository.BranchPermissionRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BranchPermissionService {

  private static final Set<RelationshipType> PARENT_TYPES =
      Set.of(RelationshipType.PARENT, RelationshipType.GUARDIAN, RelationshipType.ADOPTED);

  private final BranchPermissionRepository branchPermissionRepository;
  private final TreeMemberRepository treeMemberRepository;
  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;

  public BranchPermissionService(
      BranchPermissionRepository branchPermissionRepository,
      TreeMemberRepository treeMemberRepository,
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository
  ) {
    this.branchPermissionRepository = branchPermissionRepository;
    this.treeMemberRepository = treeMemberRepository;
    this.personRepository = personRepository;
    this.relationshipRepository = relationshipRepository;
  }

  public List<BranchRootResponse> getBranchRoots(UUID memberId) {
    return branchPermissionRepository.findAllByMemberId(memberId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public void setBranchRoots(UUID memberId, List<BranchRootRequest> requests) {
    TreeMember member = treeMemberRepository.findById(memberId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Member not found"));
    branchPermissionRepository.deleteAllByMember(member);
    if (requests != null) {
      for (BranchRootRequest req : requests) {
        BranchDirection direction = BranchDirection.valueOf(req.getDirection());
        branchPermissionRepository.save(
            TreeMemberBranchPermission.create(member, req.getPersonId(), direction));
      }
    }
  }

  /**
   * Check if a member with branch restrictions can edit the given person.
   * Returns true if:
   * - member is OWNER (no branch restrictions)
   * - member is EDITOR without branch roots (full editor)
   * - member is EDITOR with branch roots and person is within one of their branches
   */
  public boolean canEditPerson(TreeMember member, UUID personId) {
    if (member.getRole() == TreeRole.OWNER) {
      return true;
    }
    if (member.getRole() != TreeRole.EDITOR) {
      return false;
    }

    List<TreeMemberBranchPermission> branches = branchPermissionRepository.findAllByMember(member);
    if (branches.isEmpty()) {
      // Editor without branch restrictions = full edit access
      return true;
    }

    // Editor with branch restrictions — check if person is within any branch
    for (TreeMemberBranchPermission branch : branches) {
      if (isPersonInBranch(branch, personId)) {
        return true;
      }
    }
    return false;
  }

  private boolean isPersonInBranch(TreeMemberBranchPermission branch, UUID personId) {
    UUID rootId = branch.getBranchRootId();

    // The root person itself is always editable
    if (rootId.equals(personId)) {
      return true;
    }

    if (branch.getDirection() == BranchDirection.DESCENDANTS) {
      return isDescendantOf(rootId, personId);
    } else {
      return isAncestorOf(rootId, personId);
    }
  }

  /**
   * BFS down from root via parent→child edges. Returns true if targetId is reachable.
   */
  private boolean isDescendantOf(UUID rootId, UUID targetId) {
    List<Relationship> all = relationshipRepository.findAll();
    Map<UUID, List<UUID>> childrenOf = new HashMap<>();
    for (Relationship r : all) {
      if (PARENT_TYPES.contains(r.getType())) {
        childrenOf
            .computeIfAbsent(r.getFromPerson().getId(), k -> new ArrayList<>())
            .add(r.getToPerson().getId());
      }
    }

    Set<UUID> visited = new HashSet<>();
    Queue<UUID> queue = new LinkedList<>();
    queue.add(rootId);
    visited.add(rootId);

    while (!queue.isEmpty()) {
      UUID curr = queue.poll();
      if (curr.equals(targetId)) {
        return true;
      }
      for (UUID child : childrenOf.getOrDefault(curr, List.of())) {
        if (visited.add(child)) {
          queue.add(child);
        }
      }
    }
    return false;
  }

  /**
   * BFS up from root via child→parent edges. Returns true if targetId is reachable.
   */
  private boolean isAncestorOf(UUID rootId, UUID targetId) {
    List<Relationship> all = relationshipRepository.findAll();
    Map<UUID, List<UUID>> parentsOf = new HashMap<>();
    for (Relationship r : all) {
      if (PARENT_TYPES.contains(r.getType())) {
        parentsOf
            .computeIfAbsent(r.getToPerson().getId(), k -> new ArrayList<>())
            .add(r.getFromPerson().getId());
      }
    }

    Set<UUID> visited = new HashSet<>();
    Queue<UUID> queue = new LinkedList<>();
    queue.add(rootId);
    visited.add(rootId);

    while (!queue.isEmpty()) {
      UUID curr = queue.poll();
      if (curr.equals(targetId)) {
        return true;
      }
      for (UUID parent : parentsOf.getOrDefault(curr, List.of())) {
        if (visited.add(parent)) {
          queue.add(parent);
        }
      }
    }
    return false;
  }

  private BranchRootResponse toResponse(TreeMemberBranchPermission perm) {
    Person person = personRepository.findById(perm.getBranchRootId())
        .orElse(null);
    String name = person != null
        ? (person.getFirstName() != null ? person.getFirstName() : "") + " " +
          (person.getLastName() != null ? person.getLastName() : "")
        : "Unknown";
    return new BranchRootResponse(
        perm.getId(),
        perm.getBranchRootId(),
        name.trim(),
        perm.getDirection().name());
  }
}
