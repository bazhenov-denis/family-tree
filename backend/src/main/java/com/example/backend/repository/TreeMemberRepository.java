package com.example.backend.repository;

import com.example.backend.entity.FamilyTree;
import com.example.backend.entity.TreeMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreeMemberRepository
    extends JpaRepository<TreeMember, UUID> {

  List<TreeMember> findAllByUser(User user);

  Optional<TreeMember> findByTreeAndUser(FamilyTree tree, User user);

  boolean existsByTreeAndUser(FamilyTree tree, User user);

  List<TreeMember> findAllByTree(FamilyTree tree);


}
