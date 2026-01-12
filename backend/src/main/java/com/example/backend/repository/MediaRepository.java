package com.example.backend.repository;

import com.example.backend.entity.Media;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository
    extends JpaRepository<Media, UUID> {
}