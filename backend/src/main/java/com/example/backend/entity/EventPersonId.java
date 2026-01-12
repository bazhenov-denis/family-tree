package com.example.backend.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.UUID;
import java.util.Objects;

@Embeddable
public class EventPersonId implements Serializable {

  private UUID eventId;
  private UUID personId;

  public EventPersonId() {
  }

  public EventPersonId(UUID eventId, UUID personId) {
    this.eventId = eventId;
    this.personId = personId;
  }

  public UUID getEventId() {
    return eventId;
  }

  public UUID getPersonId() {
    return personId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof EventPersonId)) return false;
    EventPersonId that = (EventPersonId) o;
    return Objects.equals(eventId, that.eventId)
        && Objects.equals(personId, that.personId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(eventId, personId);
  }
}
