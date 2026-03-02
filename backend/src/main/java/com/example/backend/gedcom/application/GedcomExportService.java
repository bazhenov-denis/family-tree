package com.example.backend.gedcom.application;

import com.example.backend.auth.entity.User;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GedcomExportService {

  private static final String[] MONTHS =
      {"JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"};

  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public GedcomExportService(
      PersonRepository personRepository,
      RelationshipRepository relationshipRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.personRepository = personRepository;
    this.relationshipRepository = relationshipRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
  }

  public String export(UUID treeId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);

    List<Person> persons = personRepository.findAllByTreeId(treeId);
    List<Relationship> rels = relationshipRepository.findAllByTreeId(treeId);

    // Assign sequential GEDCOM IDs
    Map<UUID, Integer> idMap = new LinkedHashMap<>();
    int idx = 1;
    for (Person p : persons) idMap.put(p.getId(), idx++);

    Map<UUID, Person> personMap = new HashMap<>();
    for (Person p : persons) personMap.put(p.getId(), p);

    // Build FAM records
    List<FamRecord> fams = buildFams(rels, personMap);

    // Generate GEDCOM text
    StringBuilder sb = new StringBuilder();
    sb.append("0 HEAD\n");
    sb.append("1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n");
    sb.append("1 CHAR UTF-8\n");
    sb.append("1 SOUR FamilyTreeApp\n2 NAME Family Tree\n");

    for (Person p : persons) {
      int gId = idMap.get(p.getId());
      sb.append("0 @I").append(gId).append("@ INDI\n");
      String first = p.getFirstName() != null ? p.getFirstName() : "";
      String last = p.getLastName() != null ? p.getLastName() : "";
      sb.append("1 NAME ").append(first).append(" /").append(last).append("/\n");
      if (p.getGender() != null) {
        String sex = switch (p.getGender()) {
          case "MALE" -> "M";
          case "FEMALE" -> "F";
          default -> "U";
        };
        sb.append("1 SEX ").append(sex).append("\n");
      }
      if (p.getBirthDate() != null) {
        sb.append("1 BIRT\n2 DATE ").append(formatDate(p.getBirthDate())).append("\n");
        if (p.getBirthPlace() != null && !p.getBirthPlace().isBlank()) {
          sb.append("2 PLAC ").append(p.getBirthPlace()).append("\n");
        }
      }
      if (p.getDeathDate() != null) {
        sb.append("1 DEAT\n2 DATE ").append(formatDate(p.getDeathDate())).append("\n");
        if (p.getDeathPlace() != null && !p.getDeathPlace().isBlank()) {
          sb.append("2 PLAC ").append(p.getDeathPlace()).append("\n");
        }
      }
      if (p.getBio() != null && !p.getBio().isBlank()) {
        String[] lines = p.getBio().split("\n");
        sb.append("1 NOTE ").append(lines[0]).append("\n");
        for (int i = 1; i < lines.length; i++) {
          sb.append("2 CONT ").append(lines[i]).append("\n");
        }
      }
    }

    for (int i = 0; i < fams.size(); i++) {
      FamRecord fam = fams.get(i);
      sb.append("0 @F").append(i + 1).append("@ FAM\n");
      if (fam.husbId != null && idMap.containsKey(fam.husbId)) {
        sb.append("1 HUSB @I").append(idMap.get(fam.husbId)).append("@\n");
      }
      if (fam.wifeId != null && idMap.containsKey(fam.wifeId)) {
        sb.append("1 WIFE @I").append(idMap.get(fam.wifeId)).append("@\n");
      }
      for (UUID childId : fam.childIds) {
        if (idMap.containsKey(childId)) {
          sb.append("1 CHIL @I").append(idMap.get(childId)).append("@\n");
        }
      }
    }

    sb.append("0 TRLR\n");
    return sb.toString();
  }

  // ─── FAM building ─────────────────────────────────────────────────────────

  private static class FamRecord {
    UUID husbId;
    UUID wifeId;
    final List<UUID> childIds = new ArrayList<>();

    FamRecord(UUID husbId, UUID wifeId) {
      this.husbId = husbId;
      this.wifeId = wifeId;
    }

    boolean hasParent(UUID id) {
      return id.equals(husbId) || id.equals(wifeId);
    }
  }

  private List<FamRecord> buildFams(List<Relationship> rels, Map<UUID, Person> personMap) {
    List<FamRecord> fams = new ArrayList<>();
    // personId → fams where they appear as husb/wife
    Map<UUID, List<FamRecord>> personInFam = new HashMap<>();

    // Step 1: create FAM for each SPOUSE pair
    for (Relationship rel : rels) {
      if (rel.getType() != RelationshipType.SPOUSE) continue;
      UUID a = rel.getFromPerson().getId();
      UUID b = rel.getToPerson().getId();
      Person pa = personMap.get(a);
      UUID husbId = "FEMALE".equals(pa != null ? pa.getGender() : null) ? b : a;
      UUID wifeId = husbId.equals(a) ? b : a;
      FamRecord fam = new FamRecord(husbId, wifeId);
      fams.add(fam);
      personInFam.computeIfAbsent(husbId, k -> new ArrayList<>()).add(fam);
      personInFam.computeIfAbsent(wifeId, k -> new ArrayList<>()).add(fam);
    }

    // Step 2: collect parents per child
    Map<UUID, List<UUID>> childToParents = new HashMap<>();
    for (Relationship rel : rels) {
      if (rel.getType() == RelationshipType.PARENT || rel.getType() == RelationshipType.ADOPTED) {
        childToParents
            .computeIfAbsent(rel.getToPerson().getId(), k -> new ArrayList<>())
            .add(rel.getFromPerson().getId());
      }
    }

    // Step 3: assign children to FAMs
    Map<UUID, FamRecord> singleParentFams = new HashMap<>();
    for (Map.Entry<UUID, List<UUID>> entry : childToParents.entrySet()) {
      UUID childId = entry.getKey();
      List<UUID> parents = entry.getValue();

      FamRecord matched = findFamForParents(parents, personInFam);
      if (matched != null) {
        matched.childIds.add(childId);
      } else if (parents.size() == 1) {
        UUID parentId = parents.get(0);
        FamRecord fam = singleParentFams.computeIfAbsent(parentId, k -> {
          Person p = personMap.get(k);
          boolean female = p != null && "FEMALE".equals(p.getGender());
          FamRecord f = female ? new FamRecord(null, k) : new FamRecord(k, null);
          fams.add(f);
          return f;
        });
        fam.childIds.add(childId);
      } else {
        // Multiple parents not in same spouse FAM → create a new FAM
        UUID p1 = parents.get(0), p2 = parents.get(1);
        Person pp1 = personMap.get(p1);
        UUID husbId = pp1 != null && "FEMALE".equals(pp1.getGender()) ? p2 : p1;
        UUID wifeId = husbId.equals(p1) ? p2 : p1;
        FamRecord fam = new FamRecord(husbId, wifeId);
        fams.add(fam);
        personInFam.computeIfAbsent(husbId, k -> new ArrayList<>()).add(fam);
        personInFam.computeIfAbsent(wifeId, k -> new ArrayList<>()).add(fam);
        fam.childIds.add(childId);
      }
    }
    return fams;
  }

  private FamRecord findFamForParents(List<UUID> parents, Map<UUID, List<FamRecord>> personInFam) {
    if (parents.isEmpty()) return null;
    for (FamRecord fam : personInFam.getOrDefault(parents.get(0), List.of())) {
      boolean allMatch = parents.stream().allMatch(fam::hasParent);
      if (allMatch) return fam;
    }
    return null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private String formatDate(LocalDate d) {
    return d.getDayOfMonth() + " " + MONTHS[d.getMonthValue() - 1] + " " + d.getYear();
  }

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }
}
