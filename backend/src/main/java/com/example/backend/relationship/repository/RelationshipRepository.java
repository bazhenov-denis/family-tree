package com.example.backend.relationship.repository;

import com.example.backend.person.entity.Person;
import com.example.backend.relationship.entity.Relationship;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RelationshipRepository
    extends JpaRepository<Relationship, UUID> {

  List<Relationship> findAllByTreeId(UUID treeId);

  void deleteAllByFromPersonOrToPerson(Person fromPerson, Person toPerson);
}
