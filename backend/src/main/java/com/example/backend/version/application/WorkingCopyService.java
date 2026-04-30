package com.example.backend.version.application;

import com.example.backend.auth.entity.User;
import com.example.backend.event.entity.Event;
import com.example.backend.event.entity.EventPerson;
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
import com.example.backend.version.dto.CreateWorkingCopyRequest;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionEntity;
import com.example.backend.version.entity.VersionState;
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
public class WorkingCopyService {

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

  public WorkingCopyService(
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
  public VersionResponse createWorkingCopy(UUID treeId, CreateWorkingCopyRequest req) {
    User currentUser = currentUserProvider.get();
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    FamilyTree sourceTree = member.getTree();
    Version parent = findActiveVersion(treeId);

    // 1. Clone the tree
    FamilyTree clonedTree = new FamilyTree(
        sourceTree.getTitle() + " (копия)",
        sourceTree.getDescription());
    clonedTree.setOwner(currentUser);
    clonedTree.setPrivate(sourceTree.isPrivate());
    treeRepository.save(clonedTree);

    // 2. Create version record
    Version wc = Version.workingCopy(sourceTree, currentUser,
        req.getName() != null ? req.getName() : "Рабочая копия",
        req.getDescription(), parent);
    wc.setClonedTreeId(clonedTree.getId());
    versionRepository.save(wc);

    // 3. Clone all entities and serialize to version_entity
    Map<UUID, UUID> personIdMap = clonePersons(wc, sourceTree, clonedTree);
    cloneRelationships(wc, sourceTree, clonedTree, personIdMap);
    Map<UUID, UUID> eventIdMap = cloneEvents(wc, sourceTree, clonedTree, personIdMap);
    cloneMedia(wc, sourceTree, clonedTree, personIdMap, eventIdMap);

    // 4. Clone members
    cloneMembers(sourceTree, clonedTree);

    return toResponse(wc);
  }

  @Transactional
  public void discardWorkingCopy(UUID treeId, UUID versionId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanManage(member);

    Version wc = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));

    if (wc.getType() != com.example.backend.version.entity.VersionType.WORKING_COPY) {
      throw new IllegalStateException("Can only discard working copies");
    }

    wc.setState(VersionState.DISCARDED);
    versionEntityRepository.deleteAllByVersionId(wc.getId());

    // Soft-delete the cloned tree
    if (wc.getClonedTreeId() != null) {
      treeRepository.findById(wc.getClonedTreeId()).ifPresent(FamilyTree::delete);
    }
  }

  private Map<UUID, UUID> clonePersons(Version wc, FamilyTree sourceTree, FamilyTree clonedTree) {
    Map<UUID, UUID> idMap = new HashMap<>();
    for (Person p : personRepository.findAllByTreeId(sourceTree.getId())) {
      Person clone = new Person(clonedTree, p.getFirstName(), p.getLastName(),
          p.getGender(), p.getBirthDate(), p.getDeathDate());
      clone.setBirthPlace(p.getBirthPlace());
      clone.setDeathPlace(p.getDeathPlace());
      clone.setBio(p.getBio());
      clone.setPhotoUrl(p.getPhotoUrl());
      personRepository.save(clone);
      idMap.put(p.getId(), clone.getId());

      try {
        Map<String, Object> data = new HashMap<>();
        data.put("id", p.getId());
        data.put("clonedId", clone.getId());
        data.put("firstName", p.getFirstName());
        data.put("lastName", p.getLastName());
        data.put("gender", p.getGender());
        data.put("birthDate", p.getBirthDate());
        data.put("deathDate", p.getDeathDate());
        data.put("birthPlace", p.getBirthPlace());
        data.put("deathPlace", p.getDeathPlace());
        data.put("bio", p.getBio());
        data.put("photoUrl", p.getPhotoUrl());
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(wc, "PERSON", p.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize person " + p.getId(), e);
      }
    }
    return idMap;
  }

  private void cloneRelationships(Version wc, FamilyTree sourceTree, FamilyTree clonedTree,
                                   Map<UUID, UUID> personIdMap) {
    for (Relationship r : relationshipRepository.findAllByTreeId(sourceTree.getId())) {
      Person from = personRepository.findById(personIdMap.get(r.getFromPerson().getId()))
          .orElseThrow(() -> new NotFoundException("Cloned person not found"));
      Person to = personRepository.findById(personIdMap.get(r.getToPerson().getId()))
          .orElseThrow(() -> new NotFoundException("Cloned person not found"));
      relationshipRepository.save(new Relationship(clonedTree, from, to, r.getType()));

      try {
        String json = objectMapper.writeValueAsString(Map.of(
            "id", r.getId(),
            "fromPersonId", r.getFromPerson().getId(),
            "toPersonId", r.getToPerson().getId(),
            "type", r.getType().name()
        ));
        versionEntityRepository.save(VersionEntity.create(wc, "RELATIONSHIP", r.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize relationship " + r.getId(), e);
      }
    }
  }

  private Map<UUID, UUID> cloneEvents(Version wc, FamilyTree sourceTree, FamilyTree clonedTree,
                                       Map<UUID, UUID> personIdMap) {
    Map<UUID, UUID> eventIdMap = new HashMap<>();
    for (Event e : eventRepository.findAllByTreeId(sourceTree.getId())) {
      Event clone = new Event(clonedTree, e.getType(), e.getTitle(), e.getDateFrom(), e.getDateTo());
      eventRepository.save(clone);
      eventIdMap.put(e.getId(), clone.getId());

      // Clone event-person links
      for (EventPerson ep : eventPersonRepository.findAllByEvent(e)) {
        Person clonedPerson = personRepository.findById(personIdMap.get(ep.getPerson().getId()))
            .orElseThrow(() -> new NotFoundException("Cloned person not found"));
        eventPersonRepository.save(new EventPerson(clone, clonedPerson));
      }

      try {
        List<UUID> personIds = eventPersonRepository.findAllByEvent(e).stream()
            .map(ep -> ep.getPerson().getId())
            .toList();
        Map<String, Object> data = new HashMap<>();
        data.put("id", e.getId());
        data.put("clonedId", clone.getId());
        data.put("type", e.getType());
        data.put("title", e.getTitle());
        data.put("dateFrom", e.getDateFrom());
        data.put("dateTo", e.getDateTo());
        data.put("personIds", personIds);
        String json = objectMapper.writeValueAsString(data);
        versionEntityRepository.save(VersionEntity.create(wc, "EVENT", e.getId(), json));
      } catch (Exception ex) {
        throw new RuntimeException("Failed to serialize event " + e.getId(), ex);
      }
    }
    return eventIdMap;
  }

  private void cloneMedia(Version wc, FamilyTree sourceTree, FamilyTree clonedTree,
                          Map<UUID, UUID> personIdMap, Map<UUID, UUID> eventIdMap) {
    for (Media m : mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(sourceTree.getId())) {
      Person clonedPerson = m.getPerson() != null
          ? personRepository.findById(personIdMap.get(m.getPerson().getId())).orElse(null) : null;
      Event clonedEvent = m.getEvent() != null
          ? eventRepository.findById(eventIdMap.get(m.getEvent().getId())).orElse(null) : null;

      Media clone;
      if (clonedPerson != null) {
        clone = new Media(clonedTree, clonedPerson, m.getUrl(),
            m.getDescription(), m.getMimeType(), m.getFileName());
      } else if (clonedEvent != null) {
        clone = new Media(clonedTree, clonedEvent, m.getUrl(),
            m.getDescription(), m.getMimeType(), m.getFileName());
      } else {
        clone = new Media(clonedTree, clonedPerson, m.getUrl(),
            m.getDescription(), m.getMimeType(), m.getFileName());
      }
      mediaRepository.save(clone);

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
        versionEntityRepository.save(VersionEntity.create(wc, "MEDIA", m.getId(), json));
      } catch (Exception e) {
        throw new RuntimeException("Failed to serialize media " + m.getId(), e);
      }
    }
  }

  private void cloneMembers(FamilyTree sourceTree, FamilyTree clonedTree) {
    for (TreeMember m : memberRepository.findAllByTree(sourceTree)) {
      TreeMember clone = switch (m.getRole()) {
        case OWNER -> TreeMember.owner(clonedTree, m.getUser());
        case EDITOR -> TreeMember.editor(clonedTree, m.getUser());
        case COMMENTATOR -> TreeMember.commentator(clonedTree, m.getUser());
        case VIEWER -> TreeMember.viewer(clonedTree, m.getUser());
      };
      memberRepository.save(clone);
    }
  }

  private Version findActiveVersion(UUID treeId) {
    return versionRepository.findAllByTreeIdAndStateOrderByCreatedAtDesc(treeId, VersionState.ACTIVE)
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
}
