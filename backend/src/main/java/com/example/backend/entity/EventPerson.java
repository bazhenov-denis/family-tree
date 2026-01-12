package com.example.backend.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "event_person")
public class EventPerson {

  @EmbeddedId
  private EventPersonId id;

  @ManyToOne
  @MapsId("eventId")
  private Event event;

  @ManyToOne
  @MapsId("personId")
  private Person person;
}
