package com.example.backend.tree.repository;

import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.entity.TreeMemberBranchPermission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchPermissionRepository
    extends JpaRepository<TreeMemberBranchPermission, UUID> {

  List<TreeMemberBranchPermission> findAllByMember(TreeMember member);

  List<TreeMemberBranchPermission> findAllByMemberId(UUID memberId);

  void deleteAllByMember(TreeMember member);

  void deleteAllByMemberId(UUID memberId);
}
