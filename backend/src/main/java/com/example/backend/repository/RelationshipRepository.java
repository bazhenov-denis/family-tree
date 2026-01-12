package com.example.backend.repository;

import com.example.backend.entity.Relationship;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelationshipRepository
    extends JpaRepository<Relationship, UUID> {

  List<Relationship> findAllByTreeId(UUID treeId);
}
