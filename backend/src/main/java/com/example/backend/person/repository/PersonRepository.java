package com.example.backend.person.repository;

import com.example.backend.person.entity.Person;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PersonRepository
    extends JpaRepository<Person, UUID> {

  List<Person> findAllByTreeId(UUID treeId);

  @Query("SELECT p.tree.id, COUNT(p) FROM Person p WHERE p.tree.id IN :treeIds GROUP BY p.tree.id")
  List<Object[]> countPersonsByTreeIds(List<UUID> treeIds);
}
