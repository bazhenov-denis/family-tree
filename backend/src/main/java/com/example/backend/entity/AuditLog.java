package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

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

  @Column(columnDefinition = "jsonb")
  private String beforeState;

  @Column(columnDefinition = "jsonb")
  private String afterState;
}
