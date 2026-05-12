package com.example.backend.tree.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


@Entity
@Table(name = "family_tree")
public class FamilyTree extends BaseEntity {

  private String title;

  @Column(columnDefinition = "text")
  private String description;

  @ManyToOne
  private User owner;

  private boolean isPrivate;

  @Column(nullable = false)
  private boolean deleted = false;

  private Instant deletedAt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String settings;

  protected FamilyTree() {
  }

  public FamilyTree(String title, String description) {
    super();
    this.title = title;
    this.description = description;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public User getOwner() {
    return owner;
  }

  public void setOwner(User owner) {
    this.owner = owner;
  }

  public boolean isPrivate() {
    return isPrivate;
  }

  public void setPrivate(boolean aPrivate) {
    isPrivate = aPrivate;
  }

  public String getSettings() {
    return settings;
  }

  public void setSettings(String settings) {
    this.settings = settings;
  }

  public void update(String title, String description) {

    if (title != null && !title.isBlank()) {
      this.title = title;
    }

    if (description != null) {
      this.description = description;
    }
  }

  public void delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.deletedAt = Instant.now();
  }

  public boolean isDeleted() {
    return deleted;
  }

}
