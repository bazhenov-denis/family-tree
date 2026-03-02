package com.example.backend.tree.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.auth.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "tree_member",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"tree_id", "user_id"}))
public class TreeMember extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @ManyToOne
  private User user;

  @Enumerated(EnumType.STRING)
  private TreeRole role;


  protected TreeMember() {
    // for JPA
  }

  private TreeMember(FamilyTree tree, User user, TreeRole role) {
    this.tree = tree;
    this.user = user;
    this.role = role;
  }

  // 🔥 FACTORY METHOD
  public static TreeMember owner(FamilyTree tree, User user) {
    return new TreeMember(tree, user, TreeRole.OWNER);
  }

  public static TreeMember editor(FamilyTree tree, User user) {
    return new TreeMember(tree, user, TreeRole.EDITOR);
  }

  public static TreeMember viewer(FamilyTree tree, User user) {
    return new TreeMember(tree, user, TreeRole.VIEWER);
  }

  public boolean isOwner() {
    return role == TreeRole.OWNER;
  }

  public boolean canBeRemovedBy(User actor) {
    if (this.isOwner()) {
      return false;
    }
    if (this.user.equals(actor)) {
      return false;
    }
    return true;
  }

  public void changeRole(TreeRole newRole) {

    if (this.role == TreeRole.OWNER) {
      throw new IllegalStateException("Owner role cannot be changed");
    }

    if (newRole == TreeRole.OWNER) {
      throw new IllegalArgumentException("Cannot promote to owner");
    }

    this.role = newRole;
  }

  public FamilyTree getTree() {
    return tree;
  }

  public void setTree(FamilyTree tree) {
    this.tree = tree;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public TreeRole getRole() {
    return role;
  }

  public void setRole(TreeRole role) {
    this.role = role;
  }
}