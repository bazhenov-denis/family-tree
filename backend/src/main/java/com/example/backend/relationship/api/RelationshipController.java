package com.example.backend.relationship.api;

import com.example.backend.relationship.application.RelationshipService;
import com.example.backend.relationship.dto.RelationshipRequest;
import com.example.backend.relationship.dto.RelationshipResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/relationships")
public class RelationshipController {

  private final RelationshipService relationshipService;

  public RelationshipController(RelationshipService relationshipService) {
    this.relationshipService = relationshipService;
  }

  @GetMapping
  public List<RelationshipResponse> list(@PathVariable UUID treeId) {
    return relationshipService.list(treeId);
  }

  @PostMapping
  public RelationshipResponse create(
      @PathVariable UUID treeId,
      @RequestBody @Valid RelationshipRequest request
  ) {
    return relationshipService.create(treeId, request);
  }

  @DeleteMapping("/{relationshipId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable UUID treeId,
      @PathVariable UUID relationshipId
  ) {
    relationshipService.delete(treeId, relationshipId);
  }
}
