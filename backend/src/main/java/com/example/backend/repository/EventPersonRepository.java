package com.example.backend.repository;

import com.example.backend.entity.EventPerson;
import com.example.backend.entity.EventPersonId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventPersonRepository
    extends JpaRepository<EventPerson, EventPersonId> {
}