package com.example.backend.entity;

import com.example.backend.enums.RelationshipType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "relationship")
public class Relationship extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @ManyToOne
  private Person fromPerson;

  @ManyToOne
  private Person toPerson;

  @Enumerated(EnumType.STRING)
  private RelationshipType type;
}
