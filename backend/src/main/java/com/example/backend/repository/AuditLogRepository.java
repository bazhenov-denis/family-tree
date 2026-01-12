package com.example.backend.repository;

import com.example.backend.entity.AuditLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository
    extends JpaRepository<AuditLog, UUID> {
}
