package com.example.backend.event.application;

import com.example.backend.auth.entity.User;
import com.example.backend.event.dto.EventRequest;
import com.example.backend.event.dto.EventResponse;
import com.example.backend.event.dto.TreeEventResponse;
import com.example.backend.event.entity.Event;
import com.example.backend.event.entity.EventPerson;
import com.example.backend.event.repository.EventPersonRepository;
import com.example.backend.event.repository.EventRepository;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.domain.BranchPermissionService;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EventService {

  private final EventRepository eventRepository;
  private final EventPersonRepository eventPersonRepository;
  private final PersonRepository personRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final BranchPermissionService branchPermissionService;

  public EventService(
      EventRepository eventRepository,
      EventPersonRepository eventPersonRepository,
      PersonRepository personRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      BranchPermissionService branchPermissionService
  ) {
    this.eventRepository = eventRepository;
    this.eventPersonRepository = eventPersonRepository;
    this.personRepository = personRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.branchPermissionService = branchPermissionService;
  }

  public List<TreeEventResponse> listForTree(UUID treeId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    return eventPersonRepository.findAllByTreeIdWithDetails(treeId).stream()
        .map(ep -> new TreeEventResponse(ep.getEvent(), ep.getPerson()))
        .toList();
  }

  public List<EventResponse> listForPerson(UUID treeId, UUID personId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    resolvePerson(treeId, personId);
    return eventRepository.findAllByPersonId(personId).stream()
        .map(EventResponse::new)
        .toList();
  }

  @Transactional
  public EventResponse create(UUID treeId, UUID personId, EventRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    Person person = resolvePerson(treeId, personId);
    permissionService.checkCanEditPerson(member, personId, branchPermissionService);

    Event event = new Event(member.getTree(), req.getType(), req.getTitle(), req.getDateFrom(), req.getDateTo());
    eventRepository.save(event);
    eventPersonRepository.save(new EventPerson(event, person));
    return new EventResponse(event);
  }

  @Transactional
  public EventResponse update(UUID treeId, UUID eventId, EventRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    Event event = resolveEvent(treeId, eventId);

    // Check branch permissions for all persons linked to this event
    eventPersonRepository.findAllByEvent(event).stream()
        .map(EventPerson::getPerson)
        .forEach(p -> permissionService.checkCanEditPerson(member, p.getId(), branchPermissionService));

    event.setType(req.getType());
    event.setTitle(req.getTitle());
    event.setDateFrom(req.getDateFrom());
    event.setDateTo(req.getDateTo());
    eventRepository.save(event);
    return new EventResponse(event);
  }

  @Transactional
  public void delete(UUID treeId, UUID eventId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    Event event = resolveEvent(treeId, eventId);

    // Check branch permissions for all persons linked to this event
    eventPersonRepository.findAllByEvent(event).stream()
        .map(EventPerson::getPerson)
        .forEach(p -> permissionService.checkCanEditPerson(member, p.getId(), branchPermissionService));

    eventPersonRepository.deleteAllByEvent(event);
    eventRepository.delete(event);
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private Person resolvePerson(UUID treeId, UUID personId) {
    Person person = personRepository.findById(personId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Person not found"));
    if (!person.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return person;
  }

  private Event resolveEvent(UUID treeId, UUID eventId) {
    Event event = eventRepository.findById(eventId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Event not found"));
    if (!event.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return event;
  }
}
