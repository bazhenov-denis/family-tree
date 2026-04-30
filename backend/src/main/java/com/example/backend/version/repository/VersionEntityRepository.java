package com.example.backend.version.repository;

import com.example.backend.version.entity.VersionEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VersionEntityRepository extends JpaRepository<VersionEntity, UUID> {

  List<VersionEntity> findAllByVersionId(UUID versionId);

  List<VersionEntity> findAllByVersionIdAndEntityType(UUID versionId, String entityType);

  void deleteAllByVersionId(UUID versionId);
}
