package com.example.backend.event.entity;

import com.example.backend.person.entity.Person;
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

  protected EventPerson() { }

  public EventPerson(Event event, Person person) {
    this.id = new EventPersonId(event.getId(), person.getId());
    this.event = event;
    this.person = person;
  }

  public Event getEvent() { return event; }
  public Person getPerson() { return person; }
}
