package com.example.backend.event.api;

import com.example.backend.event.application.EventService;
import com.example.backend.event.dto.EventRequest;
import com.example.backend.event.dto.EventResponse;
import com.example.backend.event.dto.TreeEventResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventController {

  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @GetMapping("/api/trees/{treeId}/events")
  public List<TreeEventResponse> listForTree(@PathVariable UUID treeId) {
    return eventService.listForTree(treeId);
  }

  @GetMapping("/api/trees/{treeId}/persons/{personId}/events")
  public List<EventResponse> list(
      @PathVariable UUID treeId,
      @PathVariable UUID personId
  ) {
    return eventService.listForPerson(treeId, personId);
  }

  @PostMapping("/api/trees/{treeId}/persons/{personId}/events")
  public EventResponse create(
      @PathVariable UUID treeId,
      @PathVariable UUID personId,
      @RequestBody @Valid EventRequest request
  ) {
    return eventService.create(treeId, personId, request);
  }

  @PutMapping("/api/trees/{treeId}/events/{eventId}")
  public EventResponse update(
      @PathVariable UUID treeId,
      @PathVariable UUID eventId,
      @RequestBody @Valid EventRequest request
  ) {
    return eventService.update(treeId, eventId, request);
  }

  @DeleteMapping("/api/trees/{treeId}/events/{eventId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable UUID treeId,
      @PathVariable UUID eventId
  ) {
    eventService.delete(treeId, eventId);
  }
}
