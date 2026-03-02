package com.example.backend.person.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class PersonRequest {

  @NotBlank
  private String firstName;

  private String lastName;

  private String gender; // MALE | FEMALE | OTHER

  private LocalDate birthDate;

  private LocalDate deathDate;

  private String birthPlace;
  private String deathPlace;
  private String bio;
  private String photoUrl;

  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }

  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }

  public String getGender() { return gender; }
  public void setGender(String gender) { this.gender = gender; }

  public LocalDate getBirthDate() { return birthDate; }
  public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

  public LocalDate getDeathDate() { return deathDate; }
  public void setDeathDate(LocalDate deathDate) { this.deathDate = deathDate; }

  public String getBirthPlace() { return birthPlace; }
  public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }

  public String getDeathPlace() { return deathPlace; }
  public void setDeathPlace(String deathPlace) { this.deathPlace = deathPlace; }

  public String getBio() { return bio; }
  public void setBio(String bio) { this.bio = bio; }

  public String getPhotoUrl() { return photoUrl; }
  public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
