package com.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "media")
public class Media extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  private String fileName;
  private String mimeType;
  private String storageKey;
}
