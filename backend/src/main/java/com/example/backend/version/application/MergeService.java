package com.example.backend.version.application;

import com.example.backend.event.entity.Event;
import com.example.backend.event.repository.EventRepository;
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
import com.example.backend.auth.entity.User;
import com.example.backend.version.dto.MergeConflict;
import com.example.backend.version.dto.ResolveConflictRequest;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionEntity;
import com.example.backend.version.entity.VersionState;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MergeService {

  private final VersionRepository versionRepository;
  private final VersionEntityRepository versionEntityRepository;
  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final EventRepository eventRepository;
  private final MediaRepository mediaRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final TreePermissionService permissionService;
  private final CurrentUserProvider currentUserProvider;
  private final ObjectMapper objectMapper;

  public MergeService(
      VersionRepository versionRepository,
      VersionEntityRepository versionEntityRepository,
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository,
      EventRepository eventRepository,
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
    this.mediaRepository = mediaRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.permissionService = permissionService;
    this.currentUserProvider = currentUserProvider;
    this.objectMapper = objectMapper;
  }

  /**
   * Three-way merge: compare base snapshot vs main tree (ours) vs working copy (theirs).
   * Returns list of conflicts if any, otherwise auto-applies changes.
   */
  @Transactional(readOnly = true)
  public List<MergeConflict> getConflicts(UUID treeId, UUID versionId) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    Version base = findBaseSnapshot(wc);
    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = treeRepository.findById(wc.getClonedTreeId())
        .orElseThrow(() -> new NotFoundException("Cloned tree not found"));

    List<MergeConflict> conflicts = new ArrayList<>();
    conflicts.addAll(comparePersons(base, mainTree, clonedTree));
    conflicts.addAll(compareRelationships(base, mainTree, clonedTree));
    conflicts.addAll(compareEvents(base, mainTree, clonedTree));
    conflicts.addAll(compareMedia(base, mainTree, clonedTree));
    return conflicts;
  }

  /**
   * Resolve a single conflict by choosing OURS (main tree) or THEIRS (working copy).
   */
  @Transactional
  public void resolveConflict(UUID treeId, UUID versionId, ResolveConflictRequest req) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = treeRepository.findById(wc.getClonedTreeId())
        .orElseThrow(() -> new NotFoundException("Cloned tree not found"));

    UUID entityId = req.getEntityId();
    String entityType = req.getEntityType();
    boolean ours = "OURS".equalsIgnoreCase(req.getResolution());

    switch (entityType) {
      case "PERSON" -> applyPersonResolution(mainTree, clonedTree, entityId, ours);
      case "RELATIONSHIP" -> applyRelationshipResolution(mainTree, clonedTree, entityId, ours);
      case "EVENT" -> applyEventResolution(mainTree, clonedTree, entityId, ours);
      case "MEDIA" -> applyMediaResolution(mainTree, clonedTree, entityId, ours);
      default -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
    }
  }

  /**
   * Complete the merge: apply all non-conflicting changes and resolved conflicts,
   * then mark working copy as MERGED and soft-delete the cloned tree.
   */
  @Transactional
  public VersionResponse completeMerge(UUID treeId, UUID versionId) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    permissionService.checkCanManage(resolveMember(treeId));

    Version base = findBaseSnapshot(wc);
    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = treeRepository.findById(wc.getClonedTreeId())
        .orElseThrow(() -> new NotFoundException("Cloned tree not found"));

    // Apply auto-merge changes (no conflicts)
    mergePersons(base, mainTree, clonedTree);
    mergeRelationships(base, mainTree, clonedTree);
    mergeEvents(base, mainTree, clonedTree);
    mergeMedia(base, mainTree, clonedTree);

    // Mark working copy as merged
    wc.setState(VersionState.MERGED);

    // Soft-delete cloned tree
    clonedTree.delete();

    return toResponse(wc);
  }

  // ─── Conflict detection ────────────────────────────────────────────────────

  private List<MergeConflict> comparePersons(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    List<MergeConflict> conflicts = new ArrayList<>();
    Map<UUID, String> basePersons = base != null ? extractEntityIds(base, "PERSON") : Map.of();
    List<Person> mainPersons = personRepository.findAllByTreeId(mainTree.getId());
    List<Person> clonedPersons = personRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Person> mainMap = mainPersons.stream().collect(Collectors.toMap(Person::getId, p -> p));
    Map<UUID, Person> clonedMap = clonedPersons.stream().collect(Collectors.toMap(Person::getId, p -> p));

    // Check modified existing persons
    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Person main = mainMap.get(id);
      Person cloned = clonedMap.get(id);
      boolean inBase = basePersons.containsKey(id);

      if (main != null && cloned != null) {
        // Both exist — check if both modified from base
        if (inBase && isPersonModified(main, cloned, basePersons.get(id))) {
          conflicts.add(new MergeConflict("PERSON", id,
              main.getFirstName() + " " + main.getLastName(),
              serializePerson(main), serializePerson(cloned)));
        }
      } else if (main != null && cloned == null && inBase) {
        // Deleted in cloned, still exists in main — conflict if base had it
        conflicts.add(new MergeConflict("PERSON", id,
            "Person " + id, "exists", "deleted"));
      } else if (main == null && cloned != null && inBase) {
        // Deleted in main, still exists in cloned
        conflicts.add(new MergeConflict("PERSON", id,
            "Person " + id, "deleted", "exists"));
      }
    }

    return conflicts;
  }

  private List<MergeConflict> compareRelationships(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    List<MergeConflict> conflicts = new ArrayList<>();
    Map<UUID, String> baseRels = base != null ? extractEntityIds(base, "RELATIONSHIP") : Map.of();
    List<Relationship> mainRels = relationshipRepository.findAllByTreeId(mainTree.getId());
    List<Relationship> clonedRels = relationshipRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Relationship> mainMap = mainRels.stream().collect(Collectors.toMap(Relationship::getId, r -> r));
    Map<UUID, Relationship> clonedMap = clonedRels.stream().collect(Collectors.toMap(Relationship::getId, r -> r));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Relationship main = mainMap.get(id);
      Relationship cloned = clonedMap.get(id);
      boolean inBase = baseRels.containsKey(id);

      if (main != null && cloned != null && inBase) {
        if (isRelationshipModified(main, cloned, baseRels.get(id))) {
          conflicts.add(new MergeConflict("RELATIONSHIP", id,
              main.getType().name(),
              serializeRelationship(main), serializeRelationship(cloned)));
        }
      } else if (main != null && cloned == null && inBase) {
        conflicts.add(new MergeConflict("RELATIONSHIP", id,
            "Relationship " + id, "exists", "deleted"));
      } else if (main == null && cloned != null && inBase) {
        conflicts.add(new MergeConflict("RELATIONSHIP", id,
            "Relationship " + id, "deleted", "exists"));
      }
    }

    return conflicts;
  }

  private List<MergeConflict> compareEvents(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    List<MergeConflict> conflicts = new ArrayList<>();
    Map<UUID, String> baseEvents = base != null ? extractEntityIds(base, "EVENT") : Map.of();
    List<Event> mainEvents = eventRepository.findAllByTreeId(mainTree.getId());
    List<Event> clonedEvents = eventRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Event> mainMap = mainEvents.stream().collect(Collectors.toMap(Event::getId, e -> e));
    Map<UUID, Event> clonedMap = clonedEvents.stream().collect(Collectors.toMap(Event::getId, e -> e));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Event main = mainMap.get(id);
      Event cloned = clonedMap.get(id);
      boolean inBase = baseEvents.containsKey(id);

      if (main != null && cloned != null && inBase) {
        if (isEventModified(main, cloned, baseEvents.get(id))) {
          conflicts.add(new MergeConflict("EVENT", id,
              main.getTitle(), serializeEvent(main), serializeEvent(cloned)));
        }
      } else if (main != null && cloned == null && inBase) {
        conflicts.add(new MergeConflict("EVENT", id,
            "Event " + id, "exists", "deleted"));
      } else if (main == null && cloned != null && inBase) {
        conflicts.add(new MergeConflict("EVENT", id,
            "Event " + id, "deleted", "exists"));
      }
    }

    return conflicts;
  }

  private List<MergeConflict> compareMedia(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    List<MergeConflict> conflicts = new ArrayList<>();
    Map<UUID, String> baseMedia = base != null ? extractEntityIds(base, "MEDIA") : Map.of();
    List<Media> mainMedia = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(mainTree.getId());
    List<Media> clonedMedia = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(clonedTree.getId());

    Map<UUID, Media> mainMap = mainMedia.stream().collect(Collectors.toMap(Media::getId, m -> m));
    Map<UUID, Media> clonedMap = clonedMedia.stream().collect(Collectors.toMap(Media::getId, m -> m));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Media main = mainMap.get(id);
      Media cloned = clonedMap.get(id);
      boolean inBase = baseMedia.containsKey(id);

      if (main != null && cloned != null && inBase) {
        if (isMediaModified(main, cloned, baseMedia.get(id))) {
          conflicts.add(new MergeConflict("MEDIA", id,
              main.getFileName(), serializeMedia(main), serializeMedia(cloned)));
        }
      } else if (main != null && cloned == null && inBase) {
        conflicts.add(new MergeConflict("MEDIA", id,
            "Media " + id, "exists", "deleted"));
      } else if (main == null && cloned != null && inBase) {
        conflicts.add(new MergeConflict("MEDIA", id,
            "Media " + id, "deleted", "exists"));
      }
    }

    return conflicts;
  }

  // ─── Conflict resolution ───────────────────────────────────────────────────

  private void applyPersonResolution(FamilyTree mainTree, FamilyTree clonedTree, UUID entityId, boolean ours) {
    if (ours) {
      // Keep main tree version — no changes needed
      return;
    }
    // THEIRS: apply cloned changes to main
    personRepository.findById(entityId).ifPresent(main -> {
      personRepository.findAllByTreeId(clonedTree.getId()).stream()
          .filter(p -> p.getId().equals(entityId))
          .findFirst()
          .ifPresent(cloned -> applyPersonChanges(main, cloned));
    });
  }

  private void applyRelationshipResolution(FamilyTree mainTree, FamilyTree clonedTree, UUID entityId, boolean ours) {
    // Same logic: OURS = keep main as-is, THEIRS = apply cloned to main
    if (!ours) {
      relationshipRepository.findById(entityId).ifPresent(main -> {
        relationshipRepository.findAllByTreeId(clonedTree.getId()).stream()
            .filter(r -> r.getId().equals(entityId))
            .findFirst()
            .ifPresent(cloned -> {
              // Relationship is immutable — delete and recreate
              relationshipRepository.delete(main);
              relationshipRepository.save(new Relationship(mainTree, cloned.getFromPerson(), cloned.getToPerson(), cloned.getType()));
            });
      });
    }
  }

  private void applyEventResolution(FamilyTree mainTree, FamilyTree clonedTree, UUID entityId, boolean ours) {
    if (!ours) {
      eventRepository.findById(entityId).ifPresent(main -> {
        eventRepository.findAllByTreeId(clonedTree.getId()).stream()
            .filter(e -> e.getId().equals(entityId))
            .findFirst()
            .ifPresent(cloned -> {
              main.setType(cloned.getType());
              main.setTitle(cloned.getTitle());
              main.setDateFrom(cloned.getDateFrom());
              main.setDateTo(cloned.getDateTo());
            });
      });
    }
  }

  private void applyMediaResolution(FamilyTree mainTree, FamilyTree clonedTree, UUID entityId, boolean ours) {
    if (!ours) {
      mediaRepository.findById(entityId).ifPresent(main -> {
        mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(clonedTree.getId()).stream()
            .filter(m -> m.getId().equals(entityId))
            .findFirst()
            .ifPresent(cloned -> {
              main.setDescription(cloned.getDescription());
            });
      });
    }
  }

  // ─── Auto-merge ────────────────────────────────────────────────────────────

  private void mergePersons(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    Map<UUID, String> basePersons = base != null ? extractEntityIds(base, "PERSON") : Map.of();
    List<Person> mainPersons = personRepository.findAllByTreeId(mainTree.getId());
    List<Person> clonedPersons = personRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Person> mainMap = mainPersons.stream().collect(Collectors.toMap(Person::getId, p -> p));
    Map<UUID, Person> clonedMap = clonedPersons.stream().collect(Collectors.toMap(Person::getId, p -> p));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Person main = mainMap.get(id);
      Person cloned = clonedMap.get(id);
      boolean inBase = basePersons.containsKey(id);

      if (main != null && cloned != null) {
        if (inBase) {
          // Check if only one side modified
          boolean mainModified = isPersonModifiedFromBase(main, basePersons.get(id));
          boolean clonedModified = isPersonModifiedFromBase(cloned, basePersons.get(id));
          if (clonedModified && !mainModified) {
            // Only cloned changed → apply to main
            applyPersonChanges(main, cloned);
          }
          // If both modified → conflict (skip, user must resolve)
          // If neither → no change
        }
        // If not in base (new in both with same ID) — shouldn't happen with cloned trees
      }
      // New in cloned only, deleted in main — skip (conflict territory)
      // Deleted in cloned, exists in main — skip (conflict territory)
    }
  }

  private void mergeRelationships(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    Map<UUID, String> baseRels = base != null ? extractEntityIds(base, "RELATIONSHIP") : Map.of();
    List<Relationship> mainRels = relationshipRepository.findAllByTreeId(mainTree.getId());
    List<Relationship> clonedRels = relationshipRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Relationship> mainMap = mainRels.stream().collect(Collectors.toMap(Relationship::getId, r -> r));
    Map<UUID, Relationship> clonedMap = clonedRels.stream().collect(Collectors.toMap(Relationship::getId, r -> r));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Relationship main = mainMap.get(id);
      Relationship cloned = clonedMap.get(id);
      boolean inBase = baseRels.containsKey(id);

      if (main != null && cloned != null && inBase) {
        boolean clonedModified = isRelationshipModifiedFromBase(cloned, baseRels.get(id));
        boolean mainModified = isRelationshipModifiedFromBase(main, baseRels.get(id));
        if (clonedModified && !mainModified) {
          // Apply cloned changes
          relationshipRepository.delete(main);
          relationshipRepository.save(new Relationship(mainTree, cloned.getFromPerson(), cloned.getToPerson(), cloned.getType()));
        }
      }
    }
  }

  private void mergeEvents(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    Map<UUID, String> baseEvents = base != null ? extractEntityIds(base, "EVENT") : Map.of();
    List<Event> mainEvents = eventRepository.findAllByTreeId(mainTree.getId());
    List<Event> clonedEvents = eventRepository.findAllByTreeId(clonedTree.getId());

    Map<UUID, Event> mainMap = mainEvents.stream().collect(Collectors.toMap(Event::getId, e -> e));
    Map<UUID, Event> clonedMap = clonedEvents.stream().collect(Collectors.toMap(Event::getId, e -> e));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Event main = mainMap.get(id);
      Event cloned = clonedMap.get(id);
      boolean inBase = baseEvents.containsKey(id);

      if (main != null && cloned != null && inBase) {
        boolean clonedModified = isEventModifiedFromBase(cloned, baseEvents.get(id));
        boolean mainModified = isEventModifiedFromBase(main, baseEvents.get(id));
        if (clonedModified && !mainModified) {
          main.setType(cloned.getType());
          main.setTitle(cloned.getTitle());
          main.setDateFrom(cloned.getDateFrom());
          main.setDateTo(cloned.getDateTo());
        }
      }
    }
  }

  private void mergeMedia(Version base, FamilyTree mainTree, FamilyTree clonedTree) {
    Map<UUID, String> baseMedia = base != null ? extractEntityIds(base, "MEDIA") : Map.of();
    List<Media> mainMedia = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(mainTree.getId());
    List<Media> clonedMedia = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(clonedTree.getId());

    Map<UUID, Media> mainMap = mainMedia.stream().collect(Collectors.toMap(Media::getId, m -> m));
    Map<UUID, Media> clonedMap = clonedMedia.stream().collect(Collectors.toMap(Media::getId, m -> m));

    Set<UUID> allIds = new HashSet<>();
    allIds.addAll(mainMap.keySet());
    allIds.addAll(clonedMap.keySet());

    for (UUID id : allIds) {
      Media main = mainMap.get(id);
      Media cloned = clonedMap.get(id);
      boolean inBase = baseMedia.containsKey(id);

      if (main != null && cloned != null && inBase) {
        boolean clonedModified = isMediaModifiedFromBase(cloned, baseMedia.get(id));
        boolean mainModified = isMediaModifiedFromBase(main, baseMedia.get(id));
        if (clonedModified && !mainModified) {
          main.setDescription(cloned.getDescription());
        }
      }
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private Map<UUID, String> extractEntityIds(Version version, String entityType) {
    Map<UUID, String> result = new HashMap<>();
    List<VersionEntity> entities = versionEntityRepository.findAllByVersionIdAndEntityType(version.getId(), entityType);
    for (VersionEntity ve : entities) {
      result.put(ve.getEntityId(), ve.getEntityData());
    }
    return result;
  }

  private boolean isPersonModified(Person main, Person cloned, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !personDataEqual(main, base) || !personDataEqual(cloned, base);
    } catch (Exception e) {
      return true;
    }
  }

  private boolean isPersonModifiedFromBase(Person person, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !personDataEqual(person, base);
    } catch (Exception e) {
      return true;
    }
  }

  private boolean personDataEqual(Person person, JsonNode base) {
    String first = person.getFirstName() != null ? person.getFirstName() : "";
    String last = person.getLastName() != null ? person.getLastName() : "";
    String gender = person.getGender() != null ? person.getGender() : "";
    String birthPlace = person.getBirthPlace() != null ? person.getBirthPlace() : "";
    String deathPlace = person.getDeathPlace() != null ? person.getDeathPlace() : "";
    String bio = person.getBio() != null ? person.getBio() : "";
    String photoUrl = person.getPhotoUrl() != null ? person.getPhotoUrl() : "";

    return first.equals(base.path("firstName").asText(""))
        && last.equals(base.path("lastName").asText(""))
        && gender.equals(base.path("gender").asText(""))
        && birthPlace.equals(base.path("birthPlace").asText(""))
        && deathPlace.equals(base.path("deathPlace").asText(""))
        && bio.equals(base.path("bio").asText(""))
        && photoUrl.equals(base.path("photoUrl").asText(""));
  }

  private boolean isRelationshipModified(Relationship main, Relationship cloned, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !main.getType().name().equals(base.path("type").asText());
    } catch (Exception e) {
      return true;
    }
  }

  private boolean isRelationshipModifiedFromBase(Relationship rel, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !rel.getType().name().equals(base.path("type").asText());
    } catch (Exception e) {
      return true;
    }
  }

  private boolean isEventModified(Event main, Event cloned, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !main.getTitle().equals(base.path("title").asText())
          || !main.getType().name().equals(base.path("type").asText());
    } catch (Exception e) {
      return true;
    }
  }

  private boolean isEventModifiedFromBase(Event event, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !event.getTitle().equals(base.path("title").asText())
          || !event.getType().name().equals(base.path("type").asText());
    } catch (Exception ex) {
      return true;
    }
  }

  private boolean isMediaModified(Media main, Media cloned, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !main.getUrl().equals(base.path("url").asText())
          || !main.getFileName().equals(base.path("fileName").asText());
    } catch (Exception e) {
      return true;
    }
  }

  private boolean isMediaModifiedFromBase(Media media, String baseJson) {
    try {
      JsonNode base = objectMapper.readTree(baseJson);
      return !media.getUrl().equals(base.path("url").asText())
          || !media.getFileName().equals(base.path("fileName").asText());
    } catch (Exception e) {
      return true;
    }
  }

  private void applyPersonChanges(Person target, Person source) {
    target.setFirstName(source.getFirstName());
    target.setLastName(source.getLastName());
    target.setGender(source.getGender());
    target.setBirthDate(source.getBirthDate());
    target.setDeathDate(source.getDeathDate());
    target.setBirthPlace(source.getBirthPlace());
    target.setDeathPlace(source.getDeathPlace());
    target.setBio(source.getBio());
    target.setPhotoUrl(source.getPhotoUrl());
  }

  private String serializePerson(Person p) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "firstName", p.getFirstName(),
          "lastName", p.getLastName(),
          "gender", p.getGender(),
          "birthDate", p.getBirthDate(),
          "deathDate", p.getDeathDate()
      ));
    } catch (Exception e) {
      return "{}";
    }
  }

  private String serializeRelationship(Relationship r) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "type", r.getType().name()
      ));
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String serializeEvent(Event evt) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "title", evt.getTitle(),
          "type", evt.getType(),
          "dateFrom", evt.getDateFrom(),
          "dateTo", evt.getDateTo()
      ));
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String serializeMedia(Media m) {
    try {
      return objectMapper.writeValueAsString(Map.of(
          "url", m.getUrl(),
          "fileName", m.getFileName(),
          "description", m.getDescription()
      ));
    } catch (Exception e) {
      return "{}";
    }
  }

  private Version resolveWorkingCopy(UUID treeId, UUID versionId) {
    Version wc = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));
    if (wc.getType() != com.example.backend.version.entity.VersionType.WORKING_COPY) {
      throw new IllegalStateException("Can only merge working copies");
    }
    if (wc.getState() != com.example.backend.version.entity.VersionState.ACTIVE) {
      throw new IllegalStateException("Working copy is not active");
    }
    if (wc.getClonedTreeId() == null) {
      throw new IllegalStateException("Working copy has no cloned tree");
    }
    return wc;
  }

  private Version findBaseSnapshot(Version wc) {
    if (wc.getBaseSnapshotId() == null) return null;
    return versionRepository.findById(wc.getBaseSnapshotId()).orElse(null);
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
