package com.example.backend.graph.dto;

import java.util.UUID;

public class PersonNodeDto {

  private UUID id;
  private String fullName;
  private String gender;
  private Integer birthYear;
  private Integer deathYear;
  private String photoUrl;

  // layout
  private int level;
  private int order;

  public PersonNodeDto(
      UUID id,
      String fullName,
      String gender,
      Integer birthYear,
      Integer deathYear,
      String photoUrl,
      int level,
      int order
  ) {
    this.id = id;
    this.fullName = fullName;
    this.gender = gender;
    this.birthYear = birthYear;
    this.deathYear = deathYear;
    this.photoUrl = photoUrl;
    this.level = level;
    this.order = order;
  }

  public UUID getId() { return id; }
  public String getFullName() { return fullName; }
  public String getGender() { return gender; }
  public Integer getBirthYear() { return birthYear; }
  public Integer getDeathYear() { return deathYear; }
  public String getPhotoUrl() { return photoUrl; }
  public int getLevel() { return level; }
  public int getOrder() { return order; }
}
