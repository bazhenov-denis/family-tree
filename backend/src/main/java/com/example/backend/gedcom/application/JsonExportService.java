package com.example.backend.gedcom.application;

import com.example.backend.auth.entity.User;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class JsonExportService {

  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final MediaRepository mediaRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public JsonExportService(
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository,
      MediaRepository mediaRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.personRepository      = personRepository;
    this.relationshipRepository = relationshipRepository;
    this.mediaRepository       = mediaRepository;
    this.treeRepository        = treeRepository;
    this.memberRepository      = memberRepository;
    this.currentUserProvider   = currentUserProvider;
    this.permissionService     = permissionService;
  }

  public String export(UUID treeId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    FamilyTree tree = member.getTree();

    List<Map<String, Object>> persons = personRepository.findAllByTreeId(treeId).stream()
        .map(p -> {
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("id",         p.getId());
          m.put("firstName",  p.getFirstName());
          m.put("lastName",   p.getLastName());
          m.put("gender",     p.getGender());
          m.put("birthDate",  p.getBirthDate() != null ? p.getBirthDate().toString() : null);
          m.put("deathDate",  p.getDeathDate() != null ? p.getDeathDate().toString() : null);
          m.put("birthPlace", p.getBirthPlace());
          m.put("deathPlace", p.getDeathPlace());
          m.put("bio",        p.getBio());
          m.put("photoUrl",   p.getPhotoUrl());
          return m;
        }).toList();

    List<Map<String, Object>> relationships = relationshipRepository.findAllByTreeId(treeId).stream()
        .map(r -> {
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("id",           r.getId());
          m.put("fromPersonId", r.getFromPerson().getId());
          m.put("toPersonId",   r.getToPerson().getId());
          m.put("type",         r.getType().name());
          return m;
        }).toList();

    List<Map<String, Object>> media = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(treeId).stream()
        .map(me -> {
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("id",          me.getId());
          m.put("personId",    me.getPerson() != null ? me.getPerson().getId() : null);
          m.put("url",         me.getUrl());
          m.put("description", me.getDescription());
          m.put("mimeType",    me.getMimeType());
          return m;
        }).toList();

    Map<String, Object> root = new LinkedHashMap<>();
    root.put("exportedAt", Instant.now().toString());
    root.put("tree", Map.of(
        "id",    tree.getId().toString(),
        "title", tree.getTitle()
    ));
    root.put("persons",       persons);
    root.put("relationships", relationships);
    root.put("media",         media);

    try {
      return new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(root);
    } catch (Exception e) {
      throw new RuntimeException("JSON serialization failed", e);
    }
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }
}
