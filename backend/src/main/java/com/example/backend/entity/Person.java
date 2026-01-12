package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "person")
public class Person extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  private String firstName;
  private String lastName;
  private String gender;

  private LocalDate birthDate;
  private LocalDate deathDate;

  @Column(columnDefinition = "jsonb")
  private String attributes;
}
