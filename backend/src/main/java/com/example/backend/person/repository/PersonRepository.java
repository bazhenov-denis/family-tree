package com.example.backend.person.repository;

import com.example.backend.person.entity.Person;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository
    extends JpaRepository<Person, UUID> {

  List<Person> findAllByTreeId(UUID treeId);
}
