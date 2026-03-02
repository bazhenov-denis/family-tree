package com.example.backend.event.repository;

import com.example.backend.event.entity.Event;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EventRepository
    extends JpaRepository<Event, UUID> {

  List<Event> findAllByTreeId(UUID treeId);

  @Query("SELECT ep.event FROM EventPerson ep WHERE ep.person.id = :personId ORDER BY ep.event.dateFrom ASC NULLS LAST")
  List<Event> findAllByPersonId(UUID personId);
}
