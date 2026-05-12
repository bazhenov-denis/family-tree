package com.example.backend.version.entity;

import com.example.backend.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "version_entity")
public class VersionEntity extends BaseEntity {

  @ManyToOne
  private Version version;

  private String entityType; // PERSON, RELATIONSHIP, EVENT, MEDIA

  private UUID entityId;

  private String operation; // CREATE, UPDATE, DELETE

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String entityData;

  public static VersionEntity create(Version version, String entityType, UUID entityId, String entityData) {
    VersionEntity ve = new VersionEntity();
    ve.version = version;
    ve.entityType = entityType;
    ve.entityId = entityId;
    ve.operation = "CREATE";
    ve.entityData = entityData;
    return ve;
  }

  public static VersionEntity update(Version version, String entityType, UUID entityId, String entityData) {
    VersionEntity ve = new VersionEntity();
    ve.version = version;
    ve.entityType = entityType;
    ve.entityId = entityId;
    ve.operation = "UPDATE";
    ve.entityData = entityData;
    return ve;
  }

  public static VersionEntity delete(Version version, String entityType, UUID entityId) {
    VersionEntity ve = new VersionEntity();
    ve.version = version;
    ve.entityType = entityType;
    ve.entityId = entityId;
    ve.operation = "DELETE";
    ve.entityData = null;
    return ve;
  }

  public Version getVersion() { return version; }
  public void setVersion(Version version) { this.version = version; }
  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public UUID getEntityId() { return entityId; }
  public void setEntityId(UUID entityId) { this.entityId = entityId; }
  public String getOperation() { return operation; }
  public void setOperation(String operation) { this.operation = operation; }
  public String getEntityData() { return entityData; }
  public void setEntityData(String entityData) { this.entityData = entityData; }
}
