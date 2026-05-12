package com.example.backend.version.application;

import com.example.backend.auth.entity.User;
import com.example.backend.event.entity.Event;
import com.example.backend.event.entity.EventPerson;
import com.example.backend.event.entity.EventType;
import com.example.backend.event.repository.EventPersonRepository;
import com.example.backend.event.repository.EventRepository;
import com.example.backend.media.entity.Media;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.entity.Relationship;
import com.example.backend.relationship.entity.RelationshipType;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionEntity;
import com.example.backend.version.entity.VersionType;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestoreSnapshotService {

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

  public RestoreSnapshotService(
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
  public VersionResponse restoreSnapshot(UUID treeId, UUID versionId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanManage(member);

    FamilyTree tree = member.getTree();

    Version snapshot = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));

    if (snapshot.getType() != VersionType.SNAPSHOT) {
      throw new IllegalStateException("Can only restore from a snapshot");
    }

    List<VersionEntity> entities = versionEntityRepository.findAllByVersionId(versionId);

    // Delete in FK-safe order
    eventPersonRepository.deleteAllByEventTreeId(treeId);
    mediaRepository.deleteAllByTreeId(treeId);
    relationshipRepository.deleteAllByTreeId(treeId);
    eventRepository.deleteAllByTreeId(treeId);
    personRepository.deleteAllByTreeId(treeId);

    Map<UUID, UUID> personIdMap = new HashMap<>();
    Map<UUID, UUID> eventIdMap = new HashMap<>();

    // Restore persons
    for (VersionEntity ve : entities) {
      if (!"PERSON".equals(ve.getEntityType())) continue;
      try {
        Map<String, Object> data = objectMapper.readValue(ve.getEntityData(), Map.class);
        UUID oldId = UUID.fromString(data.get("id").toString());
        Person p = new Person(tree,
            (String) data.get("firstName"),
            (String) data.get("lastName"),
            (String) data.get("gender"),
            parseDate(data.get("birthDate")),
            parseDate(data.get("deathDate")));
        p.setBirthPlace((String) data.get("birthPlace"));
        p.setDeathPlace((String) data.get("deathPlace"));
        p.setBio((String) data.get("bio"));
        p.setPhotoUrl((String) data.get("photoUrl"));
        personRepository.save(p);
        personIdMap.put(oldId, p.getId());
      } catch (Exception e) {
        throw new RuntimeException("Failed to restore person", e);
      }
    }

    // Restore relationships
    for (VersionEntity ve : entities) {
      if (!"RELATIONSHIP".equals(ve.getEntityType())) continue;
      try {
        Map<String, Object> data = objectMapper.readValue(ve.getEntityData(), Map.class);
        UUID oldFromId = UUID.fromString(data.get("fromPersonId").toString());
        UUID oldToId = UUID.fromString(data.get("toPersonId").toString());
        UUID newFromId = personIdMap.get(oldFromId);
        UUID newToId = personIdMap.get(oldToId);
        if (newFromId == null || newToId == null) continue;
        Person from = personRepository.findById(newFromId).orElse(null);
        Person to = personRepository.findById(newToId).orElse(null);
        if (from == null || to == null) continue;
        relationshipRepository.save(new Relationship(tree, from, to,
            RelationshipType.valueOf((String) data.get("type"))));
      } catch (Exception e) {
        throw new RuntimeException("Failed to restore relationship", e);
      }
    }

    // Restore events and event-person links
    for (VersionEntity ve : entities) {
      if (!"EVENT".equals(ve.getEntityType())) continue;
      try {
        Map<String, Object> data = objectMapper.readValue(ve.getEntityData(), Map.class);
        UUID oldId = UUID.fromString(data.get("id").toString());
        Event event = new Event(tree,
            EventType.valueOf((String) data.get("type")),
            (String) data.get("title"),
            parseDate(data.get("dateFrom")),
            parseDate(data.get("dateTo")));
        eventRepository.save(event);
        eventIdMap.put(oldId, event.getId());

        @SuppressWarnings("unchecked")
        List<Object> personIds = (List<Object>) data.get("personIds");
        if (personIds != null) {
          for (Object pid : personIds) {
            UUID oldPersonId = UUID.fromString(pid.toString());
            UUID newPersonId = personIdMap.get(oldPersonId);
            if (newPersonId == null) continue;
            personRepository.findById(newPersonId).ifPresent(p ->
                eventPersonRepository.save(new EventPerson(event, p)));
          }
        }
      } catch (Exception e) {
        throw new RuntimeException("Failed to restore event", e);
      }
    }

    // Restore media
    for (VersionEntity ve : entities) {
      if (!"MEDIA".equals(ve.getEntityType())) continue;
      try {
        Map<String, Object> data = objectMapper.readValue(ve.getEntityData(), Map.class);
        Object personIdRaw = data.get("personId");
        Object eventIdRaw = data.get("eventId");

        Person person = null;
        if (personIdRaw != null) {
          UUID newPersonId = personIdMap.get(UUID.fromString(personIdRaw.toString()));
          if (newPersonId != null) person = personRepository.findById(newPersonId).orElse(null);
        }

        Event event = null;
        if (eventIdRaw != null) {
          UUID newEventId = eventIdMap.get(UUID.fromString(eventIdRaw.toString()));
          if (newEventId != null) event = eventRepository.findById(newEventId).orElse(null);
        }

        Media media;
        if (event != null) {
          media = new Media(tree, event,
              (String) data.get("url"), (String) data.get("description"),
              (String) data.get("mimeType"), (String) data.get("fileName"));
        } else {
          media = new Media(tree, person,
              (String) data.get("url"), (String) data.get("description"),
              (String) data.get("mimeType"), (String) data.get("fileName"));
        }
        mediaRepository.save(media);
      } catch (Exception e) {
        throw new RuntimeException("Failed to restore media", e);
      }
    }

    int count = versionEntityRepository.findAllByVersionId(versionId).size();
    return new VersionResponse(
        snapshot.getId(), snapshot.getName(), snapshot.getDescription(),
        snapshot.getType().name(), snapshot.getState().name(),
        snapshot.getParentId(), snapshot.getBaseSnapshotId(),
        snapshot.getCreatedAt(),
        snapshot.getCreatedBy() != null ? snapshot.getCreatedBy().getEmail() : null,
        count);
  }

  private LocalDate parseDate(Object value) {
    if (value == null) return null;
    try {
      return LocalDate.parse(value.toString());
    } catch (Exception e) {
      return null;
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
