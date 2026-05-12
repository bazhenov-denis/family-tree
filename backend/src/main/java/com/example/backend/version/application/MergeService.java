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
import com.example.backend.version.dto.MergeConflict;
import com.example.backend.version.dto.ResolveConflictRequest;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionEntity;
import com.example.backend.version.entity.VersionState;
import com.example.backend.version.entity.VersionType;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
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
  private final EventPersonRepository eventPersonRepository;
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

  @Transactional(readOnly = true)
  public List<MergeConflict> getConflicts(UUID treeId, UUID versionId) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    permissionService.checkCanView(resolveMember(treeId));

    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = resolveClonedTree(wc);
    VersionIndex index = VersionIndex.of(wc, versionEntityRepository, objectMapper);

    List<MergeConflict> conflicts = new ArrayList<>();
    conflicts.addAll(personConflicts(mainTree, clonedTree, index));
    conflicts.addAll(eventConflicts(mainTree, clonedTree, index));
    conflicts.addAll(mediaConflicts(mainTree, clonedTree, index));
    conflicts.addAll(relationshipConflicts(mainTree, clonedTree, index));
    return conflicts;
  }

  @Transactional
  public void resolveConflict(UUID treeId, UUID versionId, ResolveConflictRequest req) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    permissionService.checkCanManage(resolveMember(treeId));

    if (!"THEIRS".equalsIgnoreCase(req.getResolution())) {
      return;
    }

    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = resolveClonedTree(wc);
    VersionIndex index = VersionIndex.of(wc, versionEntityRepository, objectMapper);

    switch (req.getEntityType()) {
      case "PERSON" -> applyPersonFromCopy(mainTree, clonedTree, req.getEntityId(), index);
      case "EVENT" -> applyEventFromCopy(mainTree, clonedTree, req.getEntityId(), index);
      case "MEDIA" -> applyMediaFromCopy(mainTree, clonedTree, req.getEntityId(), index);
      case "RELATIONSHIP" -> applyRelationshipFromCopy(mainTree, clonedTree, req.getEntityId(), index);
      default -> throw new IllegalArgumentException("Unknown entity type: " + req.getEntityType());
    }
  }

  @Transactional
  public VersionResponse completeMerge(UUID treeId, UUID versionId) {
    Version wc = resolveWorkingCopy(treeId, versionId);
    permissionService.checkCanManage(resolveMember(treeId));

    FamilyTree mainTree = wc.getTree();
    FamilyTree clonedTree = resolveClonedTree(wc);
    VersionIndex index = VersionIndex.of(wc, versionEntityRepository, objectMapper);

    mergePersons(mainTree, clonedTree, index);
    mergeEvents(mainTree, clonedTree, index);
    mergeMedia(mainTree, clonedTree, index);
    mergeRelationships(mainTree, clonedTree, index);

    wc.setState(VersionState.MERGED);
    clonedTree.delete();
    return toResponse(wc);
  }

  private List<MergeConflict> personConflicts(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Person> main = byId(personRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Person> copy = byId(personRepository.findAllByTreeId(clonedTree.getId()));
    List<MergeConflict> conflicts = new ArrayList<>();

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("PERSON").entrySet()) {
      UUID originalId = entry.getKey();
      Person ours = main.get(originalId);
      Person theirs = copy.get(entry.getValue());
      JsonNode base = index.base("PERSON", originalId);
      if (base == null) continue;

      boolean oursChanged = ours != null && !personEquals(ours, base);
      boolean theirsChanged = theirs != null && !personEquals(theirs, base);
      boolean deletedDifferently = ours == null ^ theirs == null;

      if ((oursChanged && theirsChanged && !samePerson(ours, theirs)) || (deletedDifferently && (oursChanged || theirsChanged))) {
        conflicts.add(new MergeConflict("PERSON", originalId, personName(ours, theirs), serialize(ours), serialize(theirs)));
      }
    }
    return conflicts;
  }

  private List<MergeConflict> eventConflicts(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Event> main = byId(eventRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Event> copy = byId(eventRepository.findAllByTreeId(clonedTree.getId()));
    List<MergeConflict> conflicts = new ArrayList<>();

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("EVENT").entrySet()) {
      UUID originalId = entry.getKey();
      Event ours = main.get(originalId);
      Event theirs = copy.get(entry.getValue());
      JsonNode base = index.base("EVENT", originalId);
      if (base == null) continue;

      boolean oursChanged = ours != null && !eventEquals(ours, base);
      boolean theirsChanged = theirs != null && !eventEquals(theirs, base);
      if ((oursChanged && theirsChanged && !sameEvent(ours, theirs)) || ((ours == null ^ theirs == null) && (oursChanged || theirsChanged))) {
        conflicts.add(new MergeConflict("EVENT", originalId, eventName(ours, theirs), serialize(ours), serialize(theirs)));
      }
    }
    return conflicts;
  }

  private List<MergeConflict> mediaConflicts(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Media> main = byId(mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(mainTree.getId()));
    Map<UUID, Media> copy = byId(mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(clonedTree.getId()));
    List<MergeConflict> conflicts = new ArrayList<>();

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("MEDIA").entrySet()) {
      UUID originalId = entry.getKey();
      Media ours = main.get(originalId);
      Media theirs = copy.get(entry.getValue());
      JsonNode base = index.base("MEDIA", originalId);
      if (base == null) continue;

      boolean oursChanged = ours != null && !mediaEquals(ours, base);
      boolean theirsChanged = theirs != null && !mediaEquals(theirs, base);
      if ((oursChanged && theirsChanged && !sameMedia(ours, theirs)) || ((ours == null ^ theirs == null) && (oursChanged || theirsChanged))) {
        conflicts.add(new MergeConflict("MEDIA", originalId, mediaName(ours, theirs), serialize(ours), serialize(theirs)));
      }
    }
    return conflicts;
  }

  private List<MergeConflict> relationshipConflicts(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Relationship> main = byId(relationshipRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Relationship> copy = byId(relationshipRepository.findAllByTreeId(clonedTree.getId()));
    List<MergeConflict> conflicts = new ArrayList<>();

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("RELATIONSHIP").entrySet()) {
      UUID originalId = entry.getKey();
      Relationship ours = main.get(originalId);
      Relationship theirs = copy.get(entry.getValue());
      JsonNode base = index.base("RELATIONSHIP", originalId);
      if (base == null) continue;

      boolean oursChanged = ours != null && !relationshipEquals(ours, base);
      boolean theirsChanged = theirs != null && !relationshipEquals(theirs, base);
      if ((oursChanged && theirsChanged && !sameRelationship(ours, theirs, index)) || ((ours == null ^ theirs == null) && (oursChanged || theirsChanged))) {
        conflicts.add(new MergeConflict("RELATIONSHIP", originalId, relationshipName(ours, theirs), serialize(ours, index), serialize(theirs, index)));
      }
    }
    return conflicts;
  }

  private void mergePersons(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Person> main = byId(personRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Person> copy = byId(personRepository.findAllByTreeId(clonedTree.getId()));
    Set<UUID> mappedClones = new HashSet<>(index.originalToClone("PERSON").values());

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("PERSON").entrySet()) {
      Person ours = main.get(entry.getKey());
      Person theirs = copy.get(entry.getValue());
      JsonNode base = index.base("PERSON", entry.getKey());
      if (base == null) continue;

      boolean oursChanged = ours != null && !personEquals(ours, base);
      boolean theirsChanged = theirs != null && !personEquals(theirs, base);
      if (ours != null && theirs != null && theirsChanged && !oursChanged) {
        copyPersonFields(ours, theirs);
      } else if (ours != null && theirs == null && !oursChanged) {
        personRepository.delete(ours);
      }
    }

    for (Person theirs : copy.values()) {
      if (!mappedClones.contains(theirs.getId())) {
        Person created = clonePerson(mainTree, theirs);
        personRepository.save(created);
        index.remapClone("PERSON", theirs.getId(), created.getId());
      }
    }
  }

  private void mergeEvents(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Event> main = byId(eventRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Event> copy = byId(eventRepository.findAllByTreeId(clonedTree.getId()));
    Set<UUID> mappedClones = new HashSet<>(index.originalToClone("EVENT").values());

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("EVENT").entrySet()) {
      Event ours = main.get(entry.getKey());
      Event theirs = copy.get(entry.getValue());
      JsonNode base = index.base("EVENT", entry.getKey());
      if (base == null) continue;

      boolean oursChanged = ours != null && !eventEquals(ours, base);
      boolean theirsChanged = theirs != null && !eventEquals(theirs, base);
      if (ours != null && theirs != null && theirsChanged && !oursChanged) {
        copyEventFields(ours, theirs);
      } else if (ours != null && theirs == null && !oursChanged) {
        eventPersonRepository.deleteAllByEvent(ours);
        eventRepository.delete(ours);
      }
    }

    for (Event theirs : copy.values()) {
      if (!mappedClones.contains(theirs.getId())) {
        Event created = cloneEvent(mainTree, theirs);
        eventRepository.save(created);
        index.remapClone("EVENT", theirs.getId(), created.getId());
        cloneEventPersons(theirs, created, index);
      }
    }
  }

  private void mergeMedia(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Media> main = byId(mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(mainTree.getId()));
    Map<UUID, Media> copy = byId(mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(clonedTree.getId()));
    Set<UUID> mappedClones = new HashSet<>(index.originalToClone("MEDIA").values());

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("MEDIA").entrySet()) {
      Media ours = main.get(entry.getKey());
      Media theirs = copy.get(entry.getValue());
      JsonNode base = index.base("MEDIA", entry.getKey());
      if (base == null) continue;

      boolean oursChanged = ours != null && !mediaEquals(ours, base);
      boolean theirsChanged = theirs != null && !mediaEquals(theirs, base);
      if (ours != null && theirs != null && theirsChanged && !oursChanged) {
        ours.setDescription(theirs.getDescription());
      } else if (ours != null && theirs == null && !oursChanged) {
        mediaRepository.delete(ours);
      }
    }

    for (Media theirs : copy.values()) {
      if (!mappedClones.contains(theirs.getId())) {
        mediaRepository.save(cloneMedia(mainTree, theirs, index));
      }
    }
  }

  private void mergeRelationships(FamilyTree mainTree, FamilyTree clonedTree, VersionIndex index) {
    Map<UUID, Relationship> main = byId(relationshipRepository.findAllByTreeId(mainTree.getId()));
    Map<UUID, Relationship> copy = byId(relationshipRepository.findAllByTreeId(clonedTree.getId()));
    Set<UUID> mappedClones = new HashSet<>(index.originalToClone("RELATIONSHIP").values());

    for (Map.Entry<UUID, UUID> entry : index.originalToClone("RELATIONSHIP").entrySet()) {
      Relationship ours = main.get(entry.getKey());
      Relationship theirs = copy.get(entry.getValue());
      JsonNode base = index.base("RELATIONSHIP", entry.getKey());
      if (base == null) continue;

      boolean oursChanged = ours != null && !relationshipEquals(ours, base);
      boolean theirsChanged = theirs != null && !relationshipEquals(theirs, base);
      if (ours != null && theirs != null && theirsChanged && !oursChanged) {
        relationshipRepository.delete(ours);
        relationshipRepository.save(cloneRelationship(mainTree, theirs, index));
      } else if (ours != null && theirs == null && !oursChanged) {
        relationshipRepository.delete(ours);
      }
    }

    for (Relationship theirs : copy.values()) {
      if (!mappedClones.contains(theirs.getId())) {
        relationshipRepository.save(cloneRelationship(mainTree, theirs, index));
      }
    }
  }

  private void applyPersonFromCopy(FamilyTree mainTree, FamilyTree clonedTree, UUID originalId, VersionIndex index) {
    Person ours = personRepository.findById(originalId).orElse(null);
    Person theirs = personRepository.findById(index.cloneId("PERSON", originalId)).orElse(null);
    if (ours != null && theirs != null) copyPersonFields(ours, theirs);
    if (ours == null && theirs != null) personRepository.save(clonePerson(mainTree, theirs));
    if (ours != null && theirs == null) personRepository.delete(ours);
  }

  private void applyEventFromCopy(FamilyTree mainTree, FamilyTree clonedTree, UUID originalId, VersionIndex index) {
    Event ours = eventRepository.findById(originalId).orElse(null);
    Event theirs = eventRepository.findById(index.cloneId("EVENT", originalId)).orElse(null);
    if (ours != null && theirs != null) copyEventFields(ours, theirs);
    if (ours == null && theirs != null) eventRepository.save(cloneEvent(mainTree, theirs));
    if (ours != null && theirs == null) {
      eventPersonRepository.deleteAllByEvent(ours);
      eventRepository.delete(ours);
    }
  }

  private void applyMediaFromCopy(FamilyTree mainTree, FamilyTree clonedTree, UUID originalId, VersionIndex index) {
    Media ours = mediaRepository.findById(originalId).orElse(null);
    Media theirs = mediaRepository.findById(index.cloneId("MEDIA", originalId)).orElse(null);
    if (ours != null && theirs != null) ours.setDescription(theirs.getDescription());
    if (ours == null && theirs != null) mediaRepository.save(cloneMedia(mainTree, theirs, index));
    if (ours != null && theirs == null) mediaRepository.delete(ours);
  }

  private void applyRelationshipFromCopy(FamilyTree mainTree, FamilyTree clonedTree, UUID originalId, VersionIndex index) {
    Relationship ours = relationshipRepository.findById(originalId).orElse(null);
    Relationship theirs = relationshipRepository.findById(index.cloneId("RELATIONSHIP", originalId)).orElse(null);
    if (ours != null) relationshipRepository.delete(ours);
    if (theirs != null) relationshipRepository.save(cloneRelationship(mainTree, theirs, index));
  }

  private Person clonePerson(FamilyTree tree, Person source) {
    Person p = new Person(tree, source.getFirstName(), source.getLastName(), source.getGender(), source.getBirthDate(), source.getDeathDate());
    copyPersonFields(p, source);
    return p;
  }

  private Event cloneEvent(FamilyTree tree, Event source) {
    return new Event(tree, source.getType(), source.getTitle(), source.getDateFrom(), source.getDateTo());
  }

  private Media cloneMedia(FamilyTree tree, Media source, VersionIndex index) {
    Person person = source.getPerson() != null
        ? personRepository.findById(index.mainIdForClone("PERSON", source.getPerson().getId())).orElse(null)
        : null;
    Event event = source.getEvent() != null
        ? eventRepository.findById(index.mainIdForClone("EVENT", source.getEvent().getId())).orElse(null)
        : null;
    if (event != null) {
      return new Media(tree, event, source.getUrl(), source.getDescription(), source.getMimeType(), source.getFileName());
    }
    return new Media(tree, person, source.getUrl(), source.getDescription(), source.getMimeType(), source.getFileName());
  }

  private Relationship cloneRelationship(FamilyTree tree, Relationship source, VersionIndex index) {
    Person from = personRepository.findById(index.mainIdForClone("PERSON", source.getFromPerson().getId()))
        .orElseThrow(() -> new NotFoundException("Merged relationship person not found"));
    Person to = personRepository.findById(index.mainIdForClone("PERSON", source.getToPerson().getId()))
        .orElseThrow(() -> new NotFoundException("Merged relationship person not found"));
    return new Relationship(tree, from, to, source.getType());
  }

  private void cloneEventPersons(Event source, Event target, VersionIndex index) {
    for (EventPerson ep : eventPersonRepository.findAllByEvent(source)) {
      personRepository.findById(index.mainIdForClone("PERSON", ep.getPerson().getId()))
          .ifPresent(person -> eventPersonRepository.save(new EventPerson(target, person)));
    }
  }

  private void copyPersonFields(Person target, Person source) {
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

  private void copyEventFields(Event target, Event source) {
    target.setType(source.getType());
    target.setTitle(source.getTitle());
    target.setDateFrom(source.getDateFrom());
    target.setDateTo(source.getDateTo());
  }

  private boolean personEquals(Person person, JsonNode base) {
    return Objects.equals(person.getFirstName(), textOrNull(base, "firstName"))
        && Objects.equals(person.getLastName(), textOrNull(base, "lastName"))
        && Objects.equals(person.getGender(), textOrNull(base, "gender"))
        && Objects.equals(person.getBirthPlace(), textOrNull(base, "birthPlace"))
        && Objects.equals(person.getDeathPlace(), textOrNull(base, "deathPlace"))
        && Objects.equals(person.getBio(), textOrNull(base, "bio"))
        && Objects.equals(person.getPhotoUrl(), textOrNull(base, "photoUrl"));
  }

  private boolean eventEquals(Event event, JsonNode base) {
    return Objects.equals(event.getTitle(), textOrNull(base, "title"))
        && Objects.equals(event.getType() != null ? event.getType().name() : null, textOrNull(base, "type"));
  }

  private boolean mediaEquals(Media media, JsonNode base) {
    return Objects.equals(media.getUrl(), textOrNull(base, "url"))
        && Objects.equals(media.getFileName(), textOrNull(base, "fileName"))
        && Objects.equals(media.getDescription(), textOrNull(base, "description"));
  }

  private boolean relationshipEquals(Relationship rel, JsonNode base) {
    return Objects.equals(rel.getType() != null ? rel.getType().name() : null, textOrNull(base, "type"));
  }

  private boolean samePerson(Person a, Person b) {
    if (a == null || b == null) return a == b;
    return Objects.equals(a.getFirstName(), b.getFirstName())
        && Objects.equals(a.getLastName(), b.getLastName())
        && Objects.equals(a.getGender(), b.getGender())
        && Objects.equals(a.getBirthDate(), b.getBirthDate())
        && Objects.equals(a.getDeathDate(), b.getDeathDate())
        && Objects.equals(a.getBirthPlace(), b.getBirthPlace())
        && Objects.equals(a.getDeathPlace(), b.getDeathPlace())
        && Objects.equals(a.getBio(), b.getBio())
        && Objects.equals(a.getPhotoUrl(), b.getPhotoUrl());
  }

  private boolean sameEvent(Event a, Event b) {
    if (a == null || b == null) return a == b;
    return Objects.equals(a.getTitle(), b.getTitle())
        && Objects.equals(a.getType(), b.getType())
        && Objects.equals(a.getDateFrom(), b.getDateFrom())
        && Objects.equals(a.getDateTo(), b.getDateTo());
  }

  private boolean sameMedia(Media a, Media b) {
    if (a == null || b == null) return a == b;
    return Objects.equals(a.getUrl(), b.getUrl())
        && Objects.equals(a.getFileName(), b.getFileName())
        && Objects.equals(a.getMimeType(), b.getMimeType())
        && Objects.equals(a.getDescription(), b.getDescription());
  }

  private boolean sameRelationship(Relationship a, Relationship b, VersionIndex index) {
    if (a == null || b == null) return a == b;
    return Objects.equals(a.getType(), b.getType())
        && Objects.equals(a.getFromPerson().getId(), index.mainIdForClone("PERSON", b.getFromPerson().getId()))
        && Objects.equals(a.getToPerson().getId(), index.mainIdForClone("PERSON", b.getToPerson().getId()));
  }

  private String textOrNull(JsonNode node, String field) {
    JsonNode value = node.path(field);
    return value.isMissingNode() || value.isNull() ? null : value.asText();
  }

  private String personName(Person ours, Person theirs) {
    Person p = ours != null ? ours : theirs;
    return p == null ? "Персона" : ((p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
  }

  private String eventName(Event ours, Event theirs) {
    Event e = ours != null ? ours : theirs;
    return e != null && e.getTitle() != null ? e.getTitle() : "Событие";
  }

  private String mediaName(Media ours, Media theirs) {
    Media m = ours != null ? ours : theirs;
    return m != null && m.getFileName() != null ? m.getFileName() : "Медиа";
  }

  private String relationshipName(Relationship ours, Relationship theirs) {
    Relationship r = ours != null ? ours : theirs;
    return r != null && r.getType() != null ? r.getType().name() : "Связь";
  }

  private String serialize(Object value) {
    if (value == null) return "null";
    try {
      Map<String, Object> data = new HashMap<>();
      if (value instanceof Person p) {
        data.put("firstName", p.getFirstName());
        data.put("lastName", p.getLastName());
        data.put("gender", p.getGender());
        data.put("birthDate", p.getBirthDate());
        data.put("deathDate", p.getDeathDate());
        data.put("birthPlace", p.getBirthPlace());
        data.put("deathPlace", p.getDeathPlace());
        data.put("bio", p.getBio());
      } else if (value instanceof Event e) {
        data.put("title", e.getTitle());
        data.put("type", e.getType());
        data.put("dateFrom", e.getDateFrom());
        data.put("dateTo", e.getDateTo());
      } else if (value instanceof Media m) {
        data.put("fileName", m.getFileName());
        data.put("description", m.getDescription());
        data.put("url", m.getUrl());
      }
      return objectMapper.writeValueAsString(data);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String serialize(Relationship relationship, VersionIndex index) {
    if (relationship == null) return "null";
    try {
      Map<String, Object> data = new HashMap<>();
      data.put("type", relationship.getType());
      data.put("fromPersonId", relationship.getFromPerson() != null ? index.mainIdForClone("PERSON", relationship.getFromPerson().getId()) : null);
      data.put("toPersonId", relationship.getToPerson() != null ? index.mainIdForClone("PERSON", relationship.getToPerson().getId()) : null);
      return objectMapper.writeValueAsString(data);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private <T extends com.example.backend.shared.entity.BaseEntity> Map<UUID, T> byId(List<T> entities) {
    return entities.stream().collect(Collectors.toMap(com.example.backend.shared.entity.BaseEntity::getId, Function.identity()));
  }

  private Version resolveWorkingCopy(UUID treeId, UUID versionId) {
    Version wc = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));
    if (wc.getType() != VersionType.WORKING_COPY) {
      throw new IllegalStateException("Can only merge working copies");
    }
    if (wc.getState() != VersionState.ACTIVE) {
      throw new IllegalStateException("Working copy is not active");
    }
    if (wc.getClonedTreeId() == null) {
      throw new IllegalStateException("Working copy has no cloned tree");
    }
    return wc;
  }

  private FamilyTree resolveClonedTree(Version wc) {
    return treeRepository.findById(wc.getClonedTreeId())
        .orElseThrow(() -> new NotFoundException("Cloned tree not found"));
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
    VersionResponse resp = new VersionResponse(
        v.getId(), v.getName(), v.getDescription(), v.getType().name(),
        v.getState().name(), v.getParentId(), v.getBaseSnapshotId(),
        v.getCreatedAt(), v.getCreatedBy() != null ? v.getCreatedBy().getEmail() : null, count);
    resp.setClonedTreeId(v.getClonedTreeId());
    return resp;
  }

  private static class VersionIndex {
    private final Map<String, Map<UUID, JsonNode>> baseByType;
    private final Map<String, Map<UUID, UUID>> originalToCloneByType;
    private final Map<String, Map<UUID, UUID>> cloneToOriginalByType;

    private VersionIndex(
        Map<String, Map<UUID, JsonNode>> baseByType,
        Map<String, Map<UUID, UUID>> originalToCloneByType,
        Map<String, Map<UUID, UUID>> cloneToOriginalByType
    ) {
      this.baseByType = baseByType;
      this.originalToCloneByType = originalToCloneByType;
      this.cloneToOriginalByType = cloneToOriginalByType;
    }

    static VersionIndex of(Version version, VersionEntityRepository repository, ObjectMapper mapper) {
      Map<String, Map<UUID, JsonNode>> bases = new HashMap<>();
      Map<String, Map<UUID, UUID>> originalToClone = new HashMap<>();
      Map<String, Map<UUID, UUID>> cloneToOriginal = new HashMap<>();

      for (VersionEntity entity : repository.findAllByVersionId(version.getId())) {
        if (entity.getEntityData() == null) continue;
        try {
          JsonNode data = mapper.readTree(entity.getEntityData());
          UUID originalId = entity.getEntityId();
          UUID cloneId = data.hasNonNull("clonedId") ? UUID.fromString(data.get("clonedId").asText()) : originalId;
          bases.computeIfAbsent(entity.getEntityType(), key -> new HashMap<>()).put(originalId, data);
          originalToClone.computeIfAbsent(entity.getEntityType(), key -> new HashMap<>()).put(originalId, cloneId);
          cloneToOriginal.computeIfAbsent(entity.getEntityType(), key -> new HashMap<>()).put(cloneId, originalId);
        } catch (Exception ignored) {
        }
      }

      return new VersionIndex(bases, originalToClone, cloneToOriginal);
    }

    JsonNode base(String type, UUID originalId) {
      return baseByType.getOrDefault(type, Map.of()).get(originalId);
    }

    UUID cloneId(String type, UUID originalId) {
      return originalToClone(type).get(originalId);
    }

    UUID mainIdForClone(String type, UUID cloneId) {
      return cloneToOriginalByType.getOrDefault(type, Map.of()).getOrDefault(cloneId, cloneId);
    }

    Map<UUID, UUID> originalToClone(String type) {
      return originalToCloneByType.getOrDefault(type, Map.of());
    }

    void remapClone(String type, UUID cloneId, UUID mainId) {
      cloneToOriginalByType.computeIfAbsent(type, key -> new HashMap<>()).put(cloneId, mainId);
    }
  }
}
