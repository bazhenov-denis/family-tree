package com.example.backend.version.application;

import com.example.backend.auth.entity.User;
import com.example.backend.event.entity.Event;
import com.example.backend.event.repository.EventPersonRepository;
import com.example.backend.event.repository.EventRepository;
import com.example.backend.media.entity.Media;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.entity.Relationship;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.version.dto.CreateSnapshotRequest;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionEntity;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SnapshotService {

  private final VersionRepository versionRepository;
  private final VersionEntityRepository versionEntityRepository;
  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final EventRepository eventRepository;
  private final EventPersonRepository eventPersonRepository;
  private final MediaRepository mediaRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final TreePermissionService permissionService;
  private final CurrentUserProvider currentUserProvider;
  private final ObjectMapper objectMapper;

  public SnapshotService(
      VersionRepository versionRepository,
      VersionEntityRepository versionEntityRepository,
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository,
      EventRepository eventRepository,
      EventPersonRepository eventPersonRepository,
      MediaRepository mediaRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      TreePermissionService permissionService,
      CurrentUserProvider currentUserProvider,
      ObjectMapper objectMapper
  ) {
    this.versionRepository = versionRepository;
    this.versionEntityRepository = versionEntityRepository;
    this.personRepository = personRepository;
    this.relationshipRepository = relationshipRepository;
    this.eventRepository = eventRepository;
    this.eventPersonRepository = eventPersonRepository;
    this.mediaRepository = mediaRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.permissionService = permissionService;
    this.currentUserProvider = currentUserProvider;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public VersionResponse createSnapshot(UUID treeId, CreateSnapshotRequest req) {
    User currentUser = currentUserProvider.get();
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    FamilyTree tree = member.getTree();
    Version parent = findActiveVersion(treeId);

    Version snapshot = Version.snapshot(tree, currentUser,
        req.getName() != null ? req.getName() : "Снапшот",
        req.getDescription(), parent);
    versionRepository.save(snapshot);

    // Serialize all entities
    serializePersons(snapshot, treeId);
    serializeRelationships(snapshot, treeId);
    serializeEvents(snapshot, treeId);
    serializeMedia(snapshot, treeId);

    return toResponse(snapshot);
  }

  private void serializePersons(Version snapshot, UUID treeId) {
    for (Person p : personRepository.findAllByTreeId(treeId)) {
      try {
        Map<String, Object> data = new HashMap<>();
        data.put("id", p.getId());
        data.put("firstName", p.getFirstName());
        data.put("lastName", p.getLastName());
        data.put("gender", p.getGender());
        data.put("birthDate", dateString(p.getBirthDate()));
        data.put("deathDate", dateString(p.getDeathDate()));
        data.put("birthPlace", p.getBirthPlace());
        data.put("deathPlace", p.getDeathPlace());
        data.put("bio", p.getBio());
        data.put("photoUrl", p.getPhotoUrl());
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(snapshot, "PERSON", p.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize person " + p.getId(), e);
      }
    }
  }

  private void serializeRelationships(Version snapshot, UUID treeId) {
    for (Relationship r : relationshipRepository.findAllByTreeId(treeId)) {
      try {
        Map<String, Object> data = new HashMap<>();
        data.put("id", r.getId());
        data.put("fromPersonId", r.getFromPerson().getId());
        data.put("toPersonId", r.getToPerson().getId());
        data.put("type", r.getType().name());
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(snapshot, "RELATIONSHIP", r.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize relationship " + r.getId(), e);
      }
    }
  }

  private void serializeEvents(Version snapshot, UUID treeId) {
    for (Event e : eventRepository.findAllByTreeId(treeId)) {
      try {
        List<UUID> personIds = eventPersonRepository.findAllByEvent(e).stream()
            .map(ep -> ep.getPerson().getId())
            .toList();
        Map<String, Object> data = new HashMap<>();
        data.put("id", e.getId());
        data.put("type", e.getType());
        data.put("title", e.getTitle());
        data.put("dateFrom", dateString(e.getDateFrom()));
        data.put("dateTo", dateString(e.getDateTo()));
        data.put("personIds", personIds);
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(snapshot, "EVENT", e.getId(), json));
      } catch (Exception ex) {
        throw new RuntimeException("Failed to serialize event " + e.getId(), ex);
      }
    }
  }

  private void serializeMedia(Version snapshot, UUID treeId) {
    for (Media m : mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(treeId)) {
      try {
        Map<String, Object> data = new HashMap<>();
        data.put("id", m.getId());
        data.put("personId", m.getPerson() != null ? m.getPerson().getId() : null);
        data.put("eventId", m.getEvent() != null ? m.getEvent().getId() : null);
        data.put("url", m.getUrl());
        data.put("description", m.getDescription());
        data.put("mimeType", m.getMimeType());
        data.put("fileName", m.getFileName());
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(snapshot, "MEDIA", m.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize media " + m.getId(), e);
      }
    }
  }

  private Version findActiveVersion(UUID treeId) {
    return versionRepository.findAllByTreeIdAndStateOrderByCreatedAtDesc(treeId, com.example.backend.version.entity.VersionState.ACTIVE)
        .stream()
        .findFirst()
        .orElse(null);
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private VersionResponse toResponse(Version v) {
    int count = versionEntityRepository.findAllByVersionId(v.getId()).size();
    return new VersionResponse(
        v.getId(), v.getName(), v.getDescription(), v.getType().name(),
        v.getState().name(), v.getParentId(), v.getBaseSnapshotId(),
        v.getCreatedAt(), v.getCreatedBy() != null ? v.getCreatedBy().getEmail() : null, count);
  }

  private static String dateString(java.time.LocalDate date) {
    return date != null ? date.toString() : null;
  }
}
