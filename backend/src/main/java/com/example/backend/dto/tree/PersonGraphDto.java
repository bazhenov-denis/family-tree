package com.example.backend.dto.tree;

public class PersonGraphDto {

  private String id;
  private String firstName;
  private String lastName;
  private String gender;

  public PersonGraphDto(String id, String firstName, String lastName, String gender) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.gender = gender;
  }

  public String getId() {
    return id;
  }

  public String getFirstName() {
    return firstName;
  }

  public String getLastName() {
    return lastName;
  }

  public String getGender() {
    return gender;
  }
}
