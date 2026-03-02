package com.example.backend.tree.repository;

import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.example.backend.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreeMemberRepository
    extends JpaRepository<TreeMember, UUID> {

  List<TreeMember> findAllByUser(User currentUser);

  List<TreeMember> findAllByUserAndTreeDeletedFalse(User currentUser);

  Optional<TreeMember> findByTreeAndUser(FamilyTree tree, User currentUser);

  boolean existsByTreeAndUser(FamilyTree tree, User userToAdd);

  List<TreeMember> findAllByTree(FamilyTree tree);


}
