package com.example.backend.comment.entity;

import com.example.backend.auth.entity.User;
import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "comment")
public class Comment extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @ManyToOne
  private User author;

  private UUID entityId;
  private String entityType;

  private String content;

  protected Comment() { }

  public Comment(FamilyTree tree, User author, UUID entityId, String entityType, String content) {
    this.tree       = tree;
    this.author     = author;
    this.entityId   = entityId;
    this.entityType = entityType;
    this.content    = content;
  }

  public FamilyTree getTree()   { return tree; }
  public User getAuthor()       { return author; }
  public UUID getEntityId()     { return entityId; }
  public String getEntityType() { return entityType; }
  public String getContent()    { return content; }

  public void setContent(String content) { this.content = content; }
}
