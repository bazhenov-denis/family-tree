package com.example.backend.media.repository;

import com.example.backend.media.entity.Media;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MediaRepository extends JpaRepository<Media, UUID> {

  List<Media> findAllByPersonIdOrderByCreatedAtAsc(UUID personId);

  List<Media> findAllByEventIdOrderByCreatedAtAsc(UUID eventId);

  List<Media> findAllByTreeIdOrderByCreatedAtAsc(UUID treeId);

  @Query("SELECT m.tree.id, COUNT(m) FROM Media m WHERE m.tree.id IN :treeIds GROUP BY m.tree.id")
  List<Object[]> countMediaByTreeIds(List<UUID> treeIds);
}