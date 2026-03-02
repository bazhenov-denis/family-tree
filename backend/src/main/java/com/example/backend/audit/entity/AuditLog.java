package com.example.backend.audit.entity;

import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.entity.FamilyTree;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_log")
public class AuditLog extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @ManyToOne
  private User user;

  private String entityType;
  private UUID entityId;

  private String action;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String beforeState;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String afterState;

  protected AuditLog() {}

  public AuditLog(FamilyTree tree, User user, String entityType, UUID entityId,
      String action, String beforeState, String afterState) {
    this.tree = tree;
    this.user = user;
    this.entityType = entityType;
    this.entityId = entityId;
    this.action = action;
    this.beforeState = beforeState;
    this.afterState = afterState;
  }

  public FamilyTree getTree() { return tree; }
  public User getUser() { return user; }
  public String getEntityType() { return entityType; }
  public UUID getEntityId() { return entityId; }
  public String getAction() { return action; }
  public String getBeforeState() { return beforeState; }
  public String getAfterState() { return afterState; }
}
