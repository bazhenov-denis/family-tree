package com.example.backend.comment.api;

import com.example.backend.comment.application.CommentService;
import com.example.backend.comment.dto.CommentRequest;
import com.example.backend.comment.dto.CommentResponse;
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
public class CommentController {

  private final CommentService commentService;

  public CommentController(CommentService commentService) {
    this.commentService = commentService;
  }

  @GetMapping("/api/trees/{treeId}/persons/{personId}/comments")
  public List<CommentResponse> list(
      @PathVariable UUID treeId,
      @PathVariable UUID personId
  ) {
    return commentService.list(treeId, personId);
  }

  @PostMapping("/api/trees/{treeId}/persons/{personId}/comments")
  public CommentResponse create(
      @PathVariable UUID treeId,
      @PathVariable UUID personId,
      @RequestBody @Valid CommentRequest request
  ) {
    return commentService.create(treeId, personId, request);
  }

  @DeleteMapping("/api/trees/{treeId}/comments/{commentId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @PathVariable UUID treeId,
      @PathVariable UUID commentId
  ) {
    commentService.delete(treeId, commentId);
  }
}
