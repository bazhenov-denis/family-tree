package com.example.backend.version.repository;

import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionState;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VersionRepository extends JpaRepository<Version, UUID> {

  List<Version> findAllByTreeIdOrderByCreatedAtDesc(UUID treeId);

  List<Version> findAllByTreeIdAndStateOrderByCreatedAtDesc(UUID treeId, VersionState state);

  Optional<Version> findByIdAndTreeId(UUID id, UUID treeId);

  Optional<Version> findByClonedTreeId(UUID clonedTreeId);
}
