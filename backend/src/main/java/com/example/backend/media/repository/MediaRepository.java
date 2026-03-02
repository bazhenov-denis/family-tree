package com.example.backend.media.repository;

import com.example.backend.media.entity.Media;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository extends JpaRepository<Media, UUID> {

  List<Media> findAllByPersonIdOrderByCreatedAtAsc(UUID personId);

  List<Media> findAllByEventIdOrderByCreatedAtAsc(UUID eventId);

  List<Media> findAllByTreeIdOrderByCreatedAtAsc(UUID treeId);
}