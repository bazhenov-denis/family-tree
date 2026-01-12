package com.example.backend.repository;

import com.example.backend.entity.Comment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository
    extends JpaRepository<Comment, UUID> {
}
