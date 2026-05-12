package com.example.backend.relationship.application;

import com.example.backend.audit.application.AuditService;
import com.example.backend.auth.entity.User;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.dto.RelationshipRequest;
import com.example.backend.relationship.dto.RelationshipResponse;
import com.example.backend.relationship.entity.Relationship;
import com.example.backend.relationship.entity.RelationshipType;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.domain.BranchPermissionService;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
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

@Service
public class RelationshipService {

  private final RelationshipRepository relationshipRepository;
  private final PersonRepository personRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final BranchPermissionService branchPermissionService;
  private final AuditService auditService;

  public RelationshipService(
      RelationshipRepository relationshipRepository,
      PersonRepository personRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      BranchPermissionService branchPermissionService,
      AuditService auditService
  ) {
    this.relationshipRepository = relationshipRepository;
    this.personRepository = personRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.branchPermissionService = branchPermissionService;
    this.auditService = auditService;
  }

  /** Hierarchical edge types — direction encodes parent→child. */
  private static final Set<RelationshipType> GEN_TYPES =
      Set.of(RelationshipType.PARENT, RelationshipType.GUARDIAN, RelationshipType.ADOPTED);

  public List<RelationshipResponse> list(UUID treeId) {
    resolveMember(treeId);
    return relationshipRepository.findAllByTreeId(treeId).stream()
        .map(RelationshipResponse::new)
        .toList();
  }

  public RelationshipResponse create(UUID treeId, RelationshipRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    FamilyTree tree = member.getTree();

    if (req.getFromPersonId().equals(req.getToPersonId())) {
      throw new IllegalArgumentException("Нельзя создать связь человека с самим собой");
    }

    Person fromPerson = resolvePersonInTree(req.getFromPersonId(), treeId);
    Person toPerson = resolvePersonInTree(req.getToPersonId(), treeId);

    // Check branch permissions for both persons
    permissionService.checkCanEditPerson(member, fromPerson.getId(), branchPermissionService);
    permissionService.checkCanEditPerson(member, toPerson.getId(), branchPermissionService);

    checkNoDuplicate(treeId, req.getFromPersonId(), req.getToPersonId(), req.getType());

    if (GEN_TYPES.contains(req.getType())) {
      checkNoCycle(treeId, fromPerson, toPerson);
    }

    Relationship relationship = new Relationship(tree, fromPerson, toPerson, req.getType());
    relationshipRepository.save(relationship);
    auditService.record(tree, member.getUser(), "RELATIONSHIP", relationship.getId(),
        "CREATE_RELATIONSHIP", null,
        AuditService.descJson(relDesc(fromPerson, toPerson, req.getType().name())));
    return new RelationshipResponse(relationship);
  }

  /**
   * Prevent duplicate edges of the same type between the same two people.
   * SPOUSE is treated symmetrically (A↔B is the same as B↔A).
   */
  private void checkNoDuplicate(UUID treeId, UUID fromId, UUID toId, RelationshipType type) {
    List<Relationship> existing = relationshipRepository.findAllByTreeId(treeId);
    for (Relationship r : existing) {
      if (r.getType() != type) continue;
      UUID rFrom = r.getFromPerson().getId();
      UUID rTo   = r.getToPerson().getId();
      boolean exactMatch   = rFrom.equals(fromId) && rTo.equals(toId);
      boolean reverseMatch = type == RelationshipType.SPOUSE
          && rFrom.equals(toId) && rTo.equals(fromId);
      if (exactMatch || reverseMatch) {
        throw new IllegalArgumentException("Такая связь уже существует");
      }
    }
  }

  /**
   * Prevent creating a hierarchical cycle.
   * Adding edge (from→to) would create a cycle if following existing child edges
   * starting from {@code toPerson} eventually reaches {@code fromPerson}.
   */
  private void checkNoCycle(UUID treeId, Person fromPerson, Person toPerson) {
    List<Relationship> all = relationshipRepository.findAllByTreeId(treeId);

    Map<UUID, List<UUID>> childrenOf = new HashMap<>();
    for (Relationship r : all) {
      if (GEN_TYPES.contains(r.getType())) {
        childrenOf
            .computeIfAbsent(r.getFromPerson().getId(), k -> new ArrayList<>())
            .add(r.getToPerson().getId());
      }
    }

    // BFS from toPerson via child edges; if we reach fromPerson → cycle
    Set<UUID> visited = new HashSet<>();
    Queue<UUID> queue = new LinkedList<>();
    queue.add(toPerson.getId());
    visited.add(toPerson.getId());

    while (!queue.isEmpty()) {
      UUID curr = queue.poll();
      for (UUID child : childrenOf.getOrDefault(curr, List.of())) {
        if (child.equals(fromPerson.getId())) {
          throw new IllegalArgumentException(
              "Добавление этой связи создаст цикл в семейном дереве");
        }
        if (visited.add(child)) {
          queue.add(child);
        }
      }
    }
  }

  public void delete(UUID treeId, UUID relationshipId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    Relationship relationship = relationshipRepository.findById(relationshipId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Relationship not found"));

    if (!relationship.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }

    // Check branch permissions for both persons in the relationship
    permissionService.checkCanEditPerson(member, relationship.getFromPerson().getId(), branchPermissionService);
    permissionService.checkCanEditPerson(member, relationship.getToPerson().getId(), branchPermissionService);

    String before = AuditService.descJson(relDesc(
        relationship.getFromPerson(), relationship.getToPerson(), relationship.getType().name()));
    relationshipRepository.delete(relationship);
    auditService.record(member.getTree(), member.getUser(), "RELATIONSHIP", relationshipId,
        "DELETE_RELATIONSHIP", before, null);
  }

  private static String relDesc(
      com.example.backend.person.entity.Person from,
      com.example.backend.person.entity.Person to,
      String type) {
    return name(from) + " → " + name(to) + " (" + type + ")";
  }

  private static String name(com.example.backend.person.entity.Person p) {
    String first = p.getFirstName() != null ? p.getFirstName() : "";
    String last  = p.getLastName()  != null ? p.getLastName()  : "";
    return (first + " " + last).trim();
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private Person resolvePersonInTree(UUID personId, UUID treeId) {
    Person person = personRepository.findById(personId)
        .orElseThrow(() -> new IllegalArgumentException("Person not found: " + personId));
    if (!person.getTree().getId().equals(treeId)) {
      throw new IllegalArgumentException("Person does not belong to this tree");
    }
    return person;
  }
}
