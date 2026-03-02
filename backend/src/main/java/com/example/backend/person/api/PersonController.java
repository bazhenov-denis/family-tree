package com.example.backend.person.api;

import com.example.backend.person.application.PersonService;
import com.example.backend.person.dto.BirthdayResponse;
import com.example.backend.person.dto.PersonRequest;
import com.example.backend.person.dto.PersonResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/persons")
public class PersonController {

  private final PersonService personService;

  public PersonController(PersonService personService) {
    this.personService = personService;
  }

  @GetMapping
  public List<PersonResponse> list(@PathVariable UUID treeId) {
    return personService.list(treeId);
  }

  @GetMapping("/birthdays")
  public List<BirthdayResponse> birthdays(
      @PathVariable UUID treeId,
      @RequestParam(defaultValue = "30") int days
  ) {
    return personService.upcomingBirthdays(treeId, days);
  }

  @PostMapping
  public PersonResponse create(
      @PathVariable UUID treeId,
      @RequestBody @Valid PersonRequest request
  ) {
    return personService.create(treeId, request);
  }

  @GetMapping("/{personId}")
  public PersonResponse get(
      @PathVariable UUID treeId,
      @PathVariable UUID personId
  ) {
    return personService.get(treeId, personId);
  }

  @PutMapping("/{personId}")
  public PersonResponse update(
      @PathVariable UUID treeId,
      @PathVariable UUID personId,
      @RequestBody @Valid PersonRequest request
  ) {
    return personService.update(treeId, personId, request);
  }

  @DeleteMapping("/{personId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable UUID treeId,
      @PathVariable UUID personId
  ) {
    personService.delete(treeId, personId);
  }
}
