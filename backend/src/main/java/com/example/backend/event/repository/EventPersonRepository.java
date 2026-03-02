package com.example.backend.event.repository;

import com.example.backend.event.entity.Event;
import com.example.backend.event.entity.EventPerson;
import com.example.backend.event.entity.EventPersonId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventPersonRepository
    extends JpaRepository<EventPerson, EventPersonId> {

  void deleteAllByEvent(Event event);

  @Query("SELECT ep FROM EventPerson ep JOIN FETCH ep.event e JOIN FETCH ep.person p WHERE e.tree.id = :treeId ORDER BY e.dateFrom ASC NULLS LAST")
  List<EventPerson> findAllByTreeIdWithDetails(@Param("treeId") UUID treeId);
}