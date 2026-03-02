package com.example.backend.person.dto;

import java.util.UUID;

public class BirthdayResponse {

  private UUID id;
  private String fullName;
  private String photoUrl;
  private int birthYear;
  private int birthMonth;
  private int birthDay;
  private int nextBirthdayYear;
  private int daysUntil;

  public BirthdayResponse(
      UUID id, String fullName, String photoUrl,
      int birthYear, int birthMonth, int birthDay,
      int nextBirthdayYear, int daysUntil
  ) {
    this.id = id;
    this.fullName = fullName;
    this.photoUrl = photoUrl;
    this.birthYear = birthYear;
    this.birthMonth = birthMonth;
    this.birthDay = birthDay;
    this.nextBirthdayYear = nextBirthdayYear;
    this.daysUntil = daysUntil;
  }

  public UUID getId() { return id; }
  public String getFullName() { return fullName; }
  public String getPhotoUrl() { return photoUrl; }
  public int getBirthYear() { return birthYear; }
  public int getBirthMonth() { return birthMonth; }
  public int getBirthDay() { return birthDay; }
  public int getNextBirthdayYear() { return nextBirthdayYear; }
  public int getDaysUntil() { return daysUntil; }
}
