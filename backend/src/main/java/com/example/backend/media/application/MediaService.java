package com.example.backend.media.application;

import com.example.backend.auth.entity.User;
import com.example.backend.event.entity.Event;
import com.example.backend.event.repository.EventRepository;
import com.example.backend.media.dto.MediaRequest;
import com.example.backend.media.dto.MediaResponse;
import com.example.backend.media.entity.Media;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MediaService {

  private final MediaRepository mediaRepository;
  private final PersonRepository personRepository;
  private final EventRepository eventRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public MediaService(
      MediaRepository mediaRepository,
      PersonRepository personRepository,
      EventRepository eventRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.mediaRepository     = mediaRepository;
    this.personRepository    = personRepository;
    this.eventRepository     = eventRepository;
    this.treeRepository      = treeRepository;
    this.memberRepository    = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService   = permissionService;
  }

  public List<MediaResponse> list(UUID treeId, UUID personId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    resolvePerson(treeId, personId);
    return mediaRepository.findAllByPersonIdOrderByCreatedAtAsc(personId).stream()
        .map(MediaResponse::new)
        .toList();
  }

  public MediaResponse add(UUID treeId, UUID personId, MediaRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    Person person = resolvePerson(treeId, personId);

    Media media = new Media(member.getTree(), person, req.getUrl(), req.getDescription(),
        req.getMimeType(), req.getFileName());
    mediaRepository.save(media);
    return new MediaResponse(media);
  }

  public List<MediaResponse> listForEvent(UUID treeId, UUID eventId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    resolveEvent(treeId, eventId);
    return mediaRepository.findAllByEventIdOrderByCreatedAtAsc(eventId).stream()
        .map(MediaResponse::new)
        .toList();
  }

  public MediaResponse addForEvent(UUID treeId, UUID eventId, MediaRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    Event event = resolveEvent(treeId, eventId);
    Media media = new Media(member.getTree(), event, req.getUrl(), req.getDescription(),
        req.getMimeType(), req.getFileName());
    mediaRepository.save(media);
    return new MediaResponse(media);
  }

  public void delete(UUID treeId, UUID mediaId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    Media media = mediaRepository.findById(mediaId)
        .orElseThrow(() -> new NotFoundException("Media not found"));
    if (!media.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    mediaRepository.delete(media);
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private Person resolvePerson(UUID treeId, UUID personId) {
    Person person = personRepository.findById(personId)
        .orElseThrow(() -> new NotFoundException("Person not found"));
    if (!person.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return person;
  }

  private Event resolveEvent(UUID treeId, UUID eventId) {
    Event event = eventRepository.findById(eventId)
        .orElseThrow(() -> new NotFoundException("Event not found"));
    if (!event.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return event;
  }
}
