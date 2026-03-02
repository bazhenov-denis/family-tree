package com.example.backend.relationship.entity;

import com.example.backend.person.entity.Person;
import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
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

  protected Relationship() {
  }

  public Relationship(FamilyTree tree, Person fromPerson, Person toPerson, RelationshipType type) {
    this.tree = tree;
    this.fromPerson = fromPerson;
    this.toPerson = toPerson;
    this.type = type;
  }

  public FamilyTree getTree() { return tree; }

  public Person getFromPerson() { return fromPerson; }

  public Person getToPerson() { return toPerson; }

  public RelationshipType getType() { return type; }
}
