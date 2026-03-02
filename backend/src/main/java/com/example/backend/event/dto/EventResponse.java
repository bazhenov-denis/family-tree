package com.example.backend.event.dto;

import com.example.backend.event.entity.Event;
import java.time.LocalDate;
import java.util.UUID;

public class EventResponse {

  private UUID id;
  private String type;
  private String title;
  private LocalDate dateFrom;
  private LocalDate dateTo;

  public EventResponse(Event e) {
    this.id = e.getId();
    this.type = e.getType().name();
    this.title = e.getTitle();
    this.dateFrom = e.getDateFrom();
    this.dateTo = e.getDateTo();
  }

  public UUID getId() { return id; }
  public String getType() { return type; }
  public String getTitle() { return title; }
  public LocalDate getDateFrom() { return dateFrom; }
  public LocalDate getDateTo() { return dateTo; }
}
