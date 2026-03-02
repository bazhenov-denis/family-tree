package com.example.backend.event.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
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

  protected Event() { }

  public Event(FamilyTree tree, EventType type, String title, LocalDate dateFrom, LocalDate dateTo) {
    this.tree = tree;
    this.type = type;
    this.title = title;
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
  }

  public FamilyTree getTree() { return tree; }
  public EventType getType() { return type; }
  public String getTitle() { return title; }
  public LocalDate getDateFrom() { return dateFrom; }
  public LocalDate getDateTo() { return dateTo; }

  public void setType(EventType type) { this.type = type; }
  public void setTitle(String title) { this.title = title; }
  public void setDateFrom(LocalDate dateFrom) { this.dateFrom = dateFrom; }
  public void setDateTo(LocalDate dateTo) { this.dateTo = dateTo; }
}
