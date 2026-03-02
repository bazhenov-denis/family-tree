package com.example.backend.comment.dto;

import com.example.backend.comment.entity.Comment;
import java.time.Instant;
import java.util.UUID;

public class CommentResponse {

  private UUID id;
  private UUID authorId;
  private String authorName;
  private String content;
  private Instant createdAt;
  private boolean mine;

  public CommentResponse(Comment c, UUID currentUserId) {
    this.id         = c.getId();
    this.authorId   = c.getAuthor().getId();
    this.authorName = c.getAuthor().getName() != null
        ? c.getAuthor().getName()
        : c.getAuthor().getEmail();
    this.content    = c.getContent();
    this.createdAt  = c.getCreatedAt();
    this.mine       = c.getAuthor().getId().equals(currentUserId);
  }

  public UUID getId()          { return id; }
  public UUID getAuthorId()    { return authorId; }
  public String getAuthorName(){ return authorName; }
  public String getContent()   { return content; }
  public Instant getCreatedAt(){ return createdAt; }
  public boolean isMine()      { return mine; }
}
