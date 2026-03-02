package com.example.backend.tree.invite.repository;

import com.example.backend.tree.invite.entity.InviteToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteTokenRepository
    extends JpaRepository<InviteToken, UUID> {

  Optional<InviteToken> findByTokenAndUsedFalse(String token);
}
