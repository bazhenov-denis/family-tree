package com.example.backend.entity;

import com.example.backend.enums.EventType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "event")
public class Event extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @Enumerated(EnumType.STRING)
  private EventType type;

  private String title;
  private LocalDate dateFrom;
  private LocalDate dateTo;
}
