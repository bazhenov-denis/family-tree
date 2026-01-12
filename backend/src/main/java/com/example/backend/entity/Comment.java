package com.example.backend.entity;

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
}
