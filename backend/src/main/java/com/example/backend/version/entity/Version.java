package com.example.backend.version.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "version")
public class Version extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @Enumerated(EnumType.STRING)
  private VersionType type;

  @Enumerated(EnumType.STRING)
  private VersionState state = VersionState.ACTIVE;

  private UUID parentId;

  private UUID baseSnapshotId;

  private UUID clonedTreeId;

  @ManyToOne
  private User createdBy;

  public static Version snapshot(FamilyTree tree, User user, String name, String description, Version parent) {
    Version v = new Version();
    v.tree = tree;
    v.createdBy = user;
    v.name = name;
    v.description = description;
    v.type = VersionType.SNAPSHOT;
    v.state = VersionState.ACTIVE;
    if (parent != null) v.parentId = parent.getId();
    return v;
  }

  public static Version workingCopy(FamilyTree tree, User user, String name, String description, Version parent) {
    Version v = new Version();
    v.tree = tree;
    v.createdBy = user;
    v.name = name;
    v.description = description;
    v.type = VersionType.WORKING_COPY;
    v.state = VersionState.ACTIVE;
    if (parent != null) {
      v.parentId = parent.getId();
      v.baseSnapshotId = parent.getId();
    }
    return v;
  }

  public FamilyTree getTree() { return tree; }
  public void setTree(FamilyTree tree) { this.tree = tree; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public VersionType getType() { return type; }
  public void setType(VersionType type) { this.type = type; }
  public VersionState getState() { return state; }
  public void setState(VersionState state) { this.state = state; }
  public UUID getParentId() { return parentId; }
  public void setParentId(UUID parentId) { this.parentId = parentId; }
  public UUID getBaseSnapshotId() { return baseSnapshotId; }
  public void setBaseSnapshotId(UUID baseSnapshotId) { this.baseSnapshotId = baseSnapshotId; }
  public UUID getClonedTreeId() { return clonedTreeId; }
  public void setClonedTreeId(UUID clonedTreeId) { this.clonedTreeId = clonedTreeId; }
  public User getCreatedBy() { return createdBy; }
  public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}
