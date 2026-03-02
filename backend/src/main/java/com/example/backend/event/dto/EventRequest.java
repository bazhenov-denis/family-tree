package com.example.backend.event.dto;

import com.example.backend.event.entity.EventType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class EventRequest {

  @NotNull
  private EventType type;

  private String title;
  private LocalDate dateFrom;
  private LocalDate dateTo;

  public EventType getType() { return type; }
  public String getTitle() { return title; }
  public LocalDate getDateFrom() { return dateFrom; }
  public LocalDate getDateTo() { return dateTo; }
}
