package com.example.backend.event.dto;

import com.example.backend.event.entity.Event;
import com.example.backend.person.entity.Person;
import java.time.LocalDate;
import java.util.UUID;

public class TreeEventResponse {

  private UUID id;
  private String type;
  private String title;
  private LocalDate dateFrom;
  private LocalDate dateTo;
  private UUID personId;
  private String personName;

  public TreeEventResponse(Event e, Person p) {
    this.id = e.getId();
    this.type = e.getType().name();
    this.title = e.getTitle();
    this.dateFrom = e.getDateFrom();
    this.dateTo = e.getDateTo();
    this.personId = p.getId();
    this.personName = (p.getFirstName() + (p.getLastName() != null ? " " + p.getLastName() : "")).trim();
  }

  public UUID getId() { return id; }
  public String getType() { return type; }
  public String getTitle() { return title; }
  public LocalDate getDateFrom() { return dateFrom; }
  public LocalDate getDateTo() { return dateTo; }
  public UUID getPersonId() { return personId; }
  public String getPersonName() { return personName; }
}
