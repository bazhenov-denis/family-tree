package com.example.backend.comment.repository;

import com.example.backend.comment.entity.Comment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

  List<Comment> findAllByEntityIdAndEntityTypeOrderByCreatedAtAsc(UUID entityId, String entityType);
}
