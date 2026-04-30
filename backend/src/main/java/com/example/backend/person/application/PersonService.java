package com.example.backend.person.application;

import com.example.backend.audit.application.AuditService;
import com.example.backend.auth.entity.User;
import com.example.backend.person.dto.BirthdayResponse;
import com.example.backend.person.dto.PersonRequest;
import com.example.backend.person.dto.PersonResponse;
import com.example.backend.person.entity.Person;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.relationship.repository.RelationshipRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.domain.BranchPermissionService;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PersonService {

  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final BranchPermissionService branchPermissionService;
  private final AuditService auditService;

  public PersonService(
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      BranchPermissionService branchPermissionService,
      AuditService auditService
  ) {
    this.personRepository = personRepository;
    this.relationshipRepository = relationshipRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.branchPermissionService = branchPermissionService;
    this.auditService = auditService;
  }

  public List<PersonResponse> list(UUID treeId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    return personRepository.findAllByTreeId(treeId).stream()
        .map(PersonResponse::new)
        .toList();
  }

  public PersonResponse create(UUID treeId, PersonRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);

    Person person = new Person(
        member.getTree(),
        req.getFirstName(),
        req.getLastName(),
        req.getGender(),
        req.getBirthDate(),
        req.getDeathDate()
    );
    person.setBirthPlace(req.getBirthPlace());
    person.setDeathPlace(req.getDeathPlace());
    person.setBio(req.getBio());
    person.setPhotoUrl(req.getPhotoUrl());
    personRepository.save(person);
    auditService.record(member.getTree(), member.getUser(), "PERSON", person.getId(),
        "CREATE_PERSON", null, AuditService.descJson(fullName(person)));
    return new PersonResponse(person);
  }

  public PersonResponse get(UUID treeId, UUID personId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    Person person = resolvePerson(treeId, personId);
    return new PersonResponse(person);
  }

  public PersonResponse update(UUID treeId, UUID personId, PersonRequest req) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEditPerson(member, personId, branchPermissionService);

    Person person = resolvePerson(treeId, personId);
    String before = AuditService.descJson(fullName(person));
    person.setFirstName(req.getFirstName());
    person.setLastName(req.getLastName());
    person.setGender(req.getGender());
    person.setBirthDate(req.getBirthDate());
    person.setDeathDate(req.getDeathDate());
    person.setBirthPlace(req.getBirthPlace());
    person.setDeathPlace(req.getDeathPlace());
    person.setBio(req.getBio());
    person.setPhotoUrl(req.getPhotoUrl());
    personRepository.save(person);
    auditService.record(member.getTree(), member.getUser(), "PERSON", person.getId(),
        "UPDATE_PERSON", before, AuditService.descJson(fullName(person)));
    return new PersonResponse(person);
  }

  public List<BirthdayResponse> upcomingBirthdays(UUID treeId, int days) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);

    LocalDate today = LocalDate.now();
    List<BirthdayResponse> result = new ArrayList<>();

    for (Person p : personRepository.findAllByTreeId(treeId)) {
      LocalDate bd = p.getBirthDate();
      if (bd == null || p.getDeathDate() != null) continue;

      // Next birthday this year or next
      LocalDate next;
      try {
        LocalDate thisYear = LocalDate.of(today.getYear(), bd.getMonthValue(), bd.getDayOfMonth());
        next = thisYear.isBefore(today) ? thisYear.plusYears(1) : thisYear;
      } catch (DateTimeException e) {
        // Feb 29 in non-leap year — try next year
        try {
          next = LocalDate.of(today.getYear() + 1, bd.getMonthValue(), bd.getDayOfMonth());
        } catch (DateTimeException ex) {
          continue;
        }
      }

      int daysUntil = (int) ChronoUnit.DAYS.between(today, next);
      if (daysUntil <= days) {
        String fullName = ((p.getFirstName() != null ? p.getFirstName() : "") +
            " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
        result.add(new BirthdayResponse(
            p.getId(), fullName, p.getPhotoUrl(),
            bd.getYear(), bd.getMonthValue(), bd.getDayOfMonth(),
            next.getYear(), daysUntil
        ));
      }
    }

    result.sort(Comparator.comparingInt(BirthdayResponse::getDaysUntil));
    return result;
  }

  @Transactional
  public void delete(UUID treeId, UUID personId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEditPerson(member, personId, branchPermissionService);

    Person person = resolvePerson(treeId, personId);
    String before = AuditService.descJson(fullName(person));
    relationshipRepository.deleteAllByFromPersonOrToPerson(person, person);
    personRepository.delete(person);
    auditService.record(member.getTree(), member.getUser(), "PERSON", personId,
        "DELETE_PERSON", before, null);
  }

  private static String fullName(Person p) {
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

  private Person resolvePerson(UUID treeId, UUID personId) {
    Person person = personRepository.findById(personId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Person not found"));
    if (!person.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return person;
  }
}
