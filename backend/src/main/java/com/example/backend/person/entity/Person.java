package com.example.backend.person.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "person")
public class Person extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  private String firstName;
  private String lastName;
  private String gender;

  private LocalDate birthDate;
  private LocalDate deathDate;

  @Column(length = 500)
  private String birthPlace;

  @Column(length = 500)
  private String deathPlace;

  @Column(columnDefinition = "text")
  private String bio;

  private String photoUrl;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String attributes;

  protected Person() {
  }

  public Person(FamilyTree tree, String firstName, String lastName, String gender,
      LocalDate birthDate, LocalDate deathDate) {
    this.tree = tree;
    this.firstName = firstName;
    this.lastName = lastName;
    this.gender = gender;
    this.birthDate = birthDate;
    this.deathDate = deathDate;
  }

  public FamilyTree getTree() { return tree; }

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
