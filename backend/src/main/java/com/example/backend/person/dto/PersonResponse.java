package com.example.backend.person.dto;

import com.example.backend.person.entity.Person;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class PersonResponse {

  private UUID id;
  private String firstName;
  private String lastName;
  private String gender;
  private LocalDate birthDate;
  private LocalDate deathDate;
  private String birthPlace;
  private String deathPlace;
  private String bio;
  private String photoUrl;
  private Instant createdAt;

  public PersonResponse(Person p) {
    this.id = p.getId();
    this.firstName = p.getFirstName();
    this.lastName = p.getLastName();
    this.gender = p.getGender();
    this.birthDate = p.getBirthDate();
    this.deathDate = p.getDeathDate();
    this.birthPlace = p.getBirthPlace();
    this.deathPlace = p.getDeathPlace();
    this.bio = p.getBio();
    this.photoUrl = p.getPhotoUrl();
    this.createdAt = p.getCreatedAt();
  }

  public UUID getId() { return id; }
  public String getFirstName() { return firstName; }
  public String getLastName() { return lastName; }
  public String getGender() { return gender; }
  public LocalDate getBirthDate() { return birthDate; }
  public LocalDate getDeathDate() { return deathDate; }
  public String getBirthPlace() { return birthPlace; }
  public String getDeathPlace() { return deathPlace; }
  public String getBio() { return bio; }
  public String getPhotoUrl() { return photoUrl; }
  public Instant getCreatedAt() { return createdAt; }
}
