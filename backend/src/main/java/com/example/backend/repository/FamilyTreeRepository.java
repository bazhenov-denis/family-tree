package com.example.backend.repository;

import com.example.backend.entity.FamilyTree;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, UUID> {
  Optional<FamilyTree> findById(UUID id);
  Optional<FamilyTree> findByIdAndDeletedFalse(UUID id);


}