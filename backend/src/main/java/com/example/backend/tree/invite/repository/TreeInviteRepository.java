package com.example.backend.tree.invite.repository;

import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.invite.entity.InviteStatus;
import com.example.backend.tree.invite.entity.TreeInvite;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreeInviteRepository
    extends JpaRepository<TreeInvite, UUID> {

  Optional<TreeInvite> findByIdAndStatus(UUID id, InviteStatus status);

  boolean existsByTreeAndEmailAndStatus(
      FamilyTree tree,
      String email,
      InviteStatus status
  );

  List<TreeInvite> findAllByEmailAndStatus(
      String email,
      InviteStatus status
  );
}
