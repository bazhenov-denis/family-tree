package com.example.backend.media.api;

import com.example.backend.media.application.MediaService;
import com.example.backend.media.dto.MediaRequest;
import com.example.backend.media.dto.MediaResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MediaController {

  private final MediaService mediaService;

  public MediaController(MediaService mediaService) {
    this.mediaService = mediaService;
  }

  @GetMapping("/api/trees/{treeId}/persons/{personId}/media")
  public List<MediaResponse> list(
      @PathVariable UUID treeId,
      @PathVariable UUID personId
  ) {
    return mediaService.list(treeId, personId);
  }

  @PostMapping("/api/trees/{treeId}/persons/{personId}/media")
  public MediaResponse add(
      @PathVariable UUID treeId,
      @PathVariable UUID personId,
      @RequestBody @Valid MediaRequest request
  ) {
    return mediaService.add(treeId, personId, request);
  }

  @GetMapping("/api/trees/{treeId}/events/{eventId}/media")
  public List<MediaResponse> listForEvent(
      @PathVariable UUID treeId,
      @PathVariable UUID eventId
  ) {
    return mediaService.listForEvent(treeId, eventId);
  }

  @PostMapping("/api/trees/{treeId}/events/{eventId}/media")
  public MediaResponse addForEvent(
      @PathVariable UUID treeId,
      @PathVariable UUID eventId,
      @RequestBody @Valid MediaRequest request
  ) {
    return mediaService.addForEvent(treeId, eventId, request);
  }

  @DeleteMapping("/api/trees/{treeId}/media/{mediaId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable UUID treeId,
      @PathVariable UUID mediaId
  ) {
    mediaService.delete(treeId, mediaId);
  }
}
