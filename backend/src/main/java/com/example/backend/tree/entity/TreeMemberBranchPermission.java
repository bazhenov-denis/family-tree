package com.example.backend.tree.entity;

import com.example.backend.shared.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(name = "tree_member_branch_permission",
    uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "branch_root_id"}))
public class TreeMemberBranchPermission extends BaseEntity {

  @ManyToOne
  private TreeMember member;

  private UUID branchRootId;

  @Enumerated(EnumType.STRING)
  private BranchDirection direction;

  protected TreeMemberBranchPermission() {
  }

  private TreeMemberBranchPermission(TreeMember member, UUID branchRootId, BranchDirection direction) {
    this.member = member;
    this.branchRootId = branchRootId;
    this.direction = direction;
  }

  public static TreeMemberBranchPermission create(TreeMember member, UUID branchRootId, BranchDirection direction) {
    return new TreeMemberBranchPermission(member, branchRootId, direction);
  }

  public TreeMember getMember() {
    return member;
  }

  public void setMember(TreeMember member) {
    this.member = member;
  }

  public UUID getBranchRootId() {
    return branchRootId;
  }

  public void setBranchRootId(UUID branchRootId) {
    this.branchRootId = branchRootId;
  }

  public BranchDirection getDirection() {
    return direction;
  }

  public void setDirection(BranchDirection direction) {
    this.direction = direction;
  }
}
