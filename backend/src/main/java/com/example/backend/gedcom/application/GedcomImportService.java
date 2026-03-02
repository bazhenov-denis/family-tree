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
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GedcomImportService {

  private static final Map<String, Integer> MONTH_MAP = Map.ofEntries(
      Map.entry("JAN", 1), Map.entry("FEB", 2), Map.entry("MAR", 3),
      Map.entry("APR", 4), Map.entry("MAY", 5), Map.entry("JUN", 6),
      Map.entry("JUL", 7), Map.entry("AUG", 8), Map.entry("SEP", 9),
      Map.entry("OCT", 10), Map.entry("NOV", 11), Map.entry("DEC", 12)
  );

  private final PersonRepository personRepository;
  private final RelationshipRepository relationshipRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public GedcomImportService(
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

  public record ImportResult(int personsCreated, int relationshipsCreated) {}

  public record PersonPreview(String firstName, String lastName, String gender,
                               String birthDate, String deathDate) {}
  public record PreviewResult(List<PersonPreview> persons, int familiesCount) {}

  /** Parse GEDCOM and return a preview without saving anything. */
  public PreviewResult previewGedcom(UUID treeId, String content) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    ParsedGedcom parsed = parseGedcom(content);
    List<PersonPreview> previews = parsed.indis.values().stream()
        .map(i -> new PersonPreview(
            i.firstName, i.lastName, genderFrom(i.sex),
            i.birthDate != null ? i.birthDate.toString() : null,
            i.deathDate != null ? i.deathDate.toString() : null
        )).toList();
    return new PreviewResult(previews, parsed.fams.size());
  }

  @Transactional
  public ImportResult importGedcom(UUID treeId, String content) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanEdit(member);
    FamilyTree tree = member.getTree();

    ParsedGedcom parsed = parseGedcom(content);
    Map<String, IndiData> indis = parsed.indis;
    Map<String, FamData>  fams  = parsed.fams;

    // ─── Create Persons ───────────────────────────────────────────────────
    Map<String, Person> gedcomIdToPerson = new HashMap<>();
    int personsCreated = 0;

    for (IndiData indi : indis.values()) {
      Person p = new Person(
          tree,
          indi.firstName != null ? indi.firstName : "",
          indi.lastName,
          genderFrom(indi.sex),
          indi.birthDate,
          indi.deathDate
      );
      p.setBirthPlace(indi.birthPlace);
      p.setDeathPlace(indi.deathPlace);
      if (indi.note.length() > 0) p.setBio(indi.note.toString());
      personRepository.save(p);
      gedcomIdToPerson.put(indi.id, p);
      personsCreated++;
    }

    // ─── Create Relationships ─────────────────────────────────────────────
    int relsCreated = 0;

    for (FamData fam : fams.values()) {
      Person husb = fam.husbRef != null ? gedcomIdToPerson.get(fam.husbRef) : null;
      Person wife = fam.wifeRef != null ? gedcomIdToPerson.get(fam.wifeRef) : null;

      if (husb != null && wife != null) {
        relationshipRepository.save(new Relationship(tree, husb, wife, RelationshipType.SPOUSE));
        relsCreated++;
      }

      for (String childRef : fam.childRefs) {
        Person child = gedcomIdToPerson.get(childRef);
        if (child == null) continue;
        if (husb != null) {
          relationshipRepository.save(new Relationship(tree, husb, child, RelationshipType.PARENT));
          relsCreated++;
        }
        if (wife != null) {
          relationshipRepository.save(new Relationship(tree, wife, child, RelationshipType.PARENT));
          relsCreated++;
        }
      }
    }

    return new ImportResult(personsCreated, relsCreated);
  }

  // ─── Shared GEDCOM parser ─────────────────────────────────────────────────

  private record ParsedGedcom(Map<String, IndiData> indis, Map<String, FamData> fams) {}

  private ParsedGedcom parseGedcom(String content) {
    Map<String, IndiData> indis = new LinkedHashMap<>();
    Map<String, FamData>  fams  = new LinkedHashMap<>();

    IndiData currentIndi  = null;
    FamData  currentFam   = null;
    String   currentEvent = null;
    boolean  inNote       = false;

    for (String raw : content.split("\\r?\\n")) {
      GedcomLine line = parseLine(raw);
      if (line == null) continue;

      if (line.level == 0) {
        if (currentIndi != null) indis.put(currentIndi.id, currentIndi);
        if (currentFam  != null) fams.put(currentFam.id,   currentFam);
        currentIndi  = null;
        currentFam   = null;
        currentEvent = null;
        inNote       = false;

        if ("INDI".equals(line.tag) && line.xref != null) {
          currentIndi = new IndiData(line.xref);
        } else if ("FAM".equals(line.tag) && line.xref != null) {
          currentFam = new FamData(line.xref);
        }

      } else if (currentIndi != null) {
        switch (line.tag) {
          case "NAME" -> {
            String[] n = parseName(line.value);
            currentIndi.firstName = n[0];
            currentIndi.lastName  = n[1];
            currentEvent = null; inNote = false;
          }
          case "SEX"  -> { currentIndi.sex = line.value; currentEvent = null; inNote = false; }
          case "BIRT" -> { currentEvent = "BIRT"; inNote = false; }
          case "DEAT" -> { currentEvent = "DEAT"; inNote = false; }
          case "DATE" -> {
            LocalDate d = parseDate(line.value);
            if ("BIRT".equals(currentEvent)) currentIndi.birthDate = d;
            else if ("DEAT".equals(currentEvent)) currentIndi.deathDate = d;
          }
          case "PLAC" -> {
            if ("BIRT".equals(currentEvent)) currentIndi.birthPlace = line.value;
            else if ("DEAT".equals(currentEvent)) currentIndi.deathPlace = line.value;
          }
          case "NOTE" -> { if (line.value != null) currentIndi.note.append(line.value); currentEvent = null; inNote = true; }
          case "CONT" -> { if (inNote && line.value != null) currentIndi.note.append('\n').append(line.value); }
          default -> {}
        }
      } else if (currentFam != null) {
        switch (line.tag) {
          case "HUSB" -> currentFam.husbRef = stripRef(line.value);
          case "WIFE" -> currentFam.wifeRef = stripRef(line.value);
          case "CHIL" -> currentFam.childRefs.add(stripRef(line.value));
          default -> {}
        }
      }
    }
    if (currentIndi != null) indis.put(currentIndi.id, currentIndi);
    if (currentFam  != null) fams.put(currentFam.id,   currentFam);

    return new ParsedGedcom(indis, fams);
  }

  // ─── GEDCOM line parser ────────────────────────────────────────────────────

  private record GedcomLine(int level, String xref, String tag, String value) {}

  private GedcomLine parseLine(String raw) {
    String line = raw.trim();
    if (line.isEmpty()) return null;
    int sp1 = line.indexOf(' ');
    if (sp1 < 0) return null;
    int level;
    try { level = Integer.parseInt(line.substring(0, sp1)); }
    catch (NumberFormatException e) { return null; }

    String rest = line.substring(sp1 + 1).trim();
    String xref = null;
    String tag;
    String value = null;

    if (level == 0 && rest.startsWith("@")) {
      int endAt = rest.indexOf('@', 1);
      if (endAt > 0) {
        xref = rest.substring(0, endAt + 1);
        String afterXref = rest.substring(endAt + 1).trim();
        int sp = afterXref.indexOf(' ');
        tag = sp < 0 ? afterXref : afterXref.substring(0, sp);
        value = sp < 0 ? null : afterXref.substring(sp + 1).trim();
      } else {
        tag = rest;
      }
    } else {
      int sp = rest.indexOf(' ');
      tag = sp < 0 ? rest : rest.substring(0, sp);
      value = sp < 0 ? null : rest.substring(sp + 1).trim();
    }

    return new GedcomLine(level, xref, tag, value);
  }

  // ─── Date & name helpers ───────────────────────────────────────────────────

  private LocalDate parseDate(String s) {
    if (s == null || s.isBlank()) return null;
    // Remove qualifier prefixes like ABT, BEF, AFT
    String clean = s.trim().replaceAll("(?i)^(ABT|BEF|AFT|EST|CAL|INT)\\s+", "");
    String[] parts = clean.split("\\s+");
    try {
      if (parts.length >= 3) {
        int day = Integer.parseInt(parts[0]);
        int month = MONTH_MAP.getOrDefault(parts[1].toUpperCase(), 1);
        int year = Integer.parseInt(parts[2]);
        return LocalDate.of(year, month, day);
      } else if (parts.length == 2) {
        int month = MONTH_MAP.getOrDefault(parts[0].toUpperCase(), 0);
        if (month == 0) return null;
        return LocalDate.of(Integer.parseInt(parts[1]), month, 1);
      } else if (parts.length == 1) {
        return LocalDate.of(Integer.parseInt(parts[0]), 1, 1);
      }
    } catch (NumberFormatException | DateTimeException ignored) {}
    return null;
  }

  private String[] parseName(String name) {
    if (name == null || name.isBlank()) return new String[]{"", ""};
    if (name.contains("/")) {
      String[] parts = name.split("/", 3);
      return new String[]{parts[0].trim(), parts.length > 1 ? parts[1].trim() : ""};
    }
    String[] parts = name.trim().split("\\s+", 2);
    return new String[]{parts[0], parts.length > 1 ? parts[1] : ""};
  }

  private String stripRef(String val) {
    if (val == null) return null;
    return val.startsWith("@") && val.endsWith("@") ? val : val.replaceAll("@", "").trim();
  }

  private String genderFrom(String sex) {
    if ("M".equalsIgnoreCase(sex)) return "MALE";
    if ("F".equalsIgnoreCase(sex)) return "FEMALE";
    return "OTHER";
  }

  // ─── Inner data classes ────────────────────────────────────────────────────

  private static class IndiData {
    final String id;
    String firstName, lastName, sex, birthPlace, deathPlace;
    LocalDate birthDate, deathDate;
    final StringBuilder note = new StringBuilder();
    IndiData(String id) { this.id = id; }
  }

  private static class FamData {
    final String id;
    String husbRef, wifeRef;
    final List<String> childRefs = new ArrayList<>();
    FamData(String id) { this.id = id; }
  }

  // ─── Auth helper ───────────────────────────────────────────────────────────

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }
}
