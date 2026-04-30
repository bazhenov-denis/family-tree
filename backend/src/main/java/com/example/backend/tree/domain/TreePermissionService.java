package com.example.backend.tree.domain;

import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.entity.TreeRole;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TreePermissionService {

  public void checkCanView(TreeMember member) {
    // VIEWER, COMMENTATOR, EDITOR, OWNER — все могут смотреть
    if (member == null) {
      throw new SecurityException("Access denied");
    }
  }

  public void checkCanComment(TreeMember member) {
    // COMMENTATOR, EDITOR, OWNER могут писать комментарии
    if (member == null || member.getRole() == TreeRole.VIEWER) {
      throw new SecurityException("Comment permission required");
    }
  }

  public void checkCanEdit(TreeMember member) {
    // EDITOR, OWNER могут редактировать (без учёта ветвей)
    if (member == null) {
      throw new SecurityException("Access denied");
    }
    if (member.getRole() == TreeRole.VIEWER || member.getRole() == TreeRole.COMMENTATOR) {
      throw new SecurityException("Edit permission required");
    }
  }

  /**
   * Check if member can edit a specific person. For EDITORs with branch restrictions,
   * delegates to BranchPermissionService. For OWNER and full EDITORs, allows directly.
   */
  public void checkCanEditPerson(TreeMember member, UUID personId, BranchPermissionService branchService) {
    checkCanEdit(member);
    if (member.getRole() == TreeRole.OWNER) {
      return;
    }
    // EDITOR — check branch restrictions
    if (!branchService.canEditPerson(member, personId)) {
      throw new SecurityException("You can only edit persons within your assigned branches");
    }
  }

  public void checkCanManage(TreeMember member) {
    if (member == null || member.getRole() != TreeRole.OWNER) {
      throw new SecurityException("Manage permission required");
    }
  }

  public void checkCanManageMembers(TreeMember member) {
    if (member == null || member.getRole() != TreeRole.OWNER) {
      throw new SecurityException("Only owner can manage members");
    }
  }

  public void checkCanViewMembers(TreeMember member) {
    if (member == null) {
      throw new SecurityException("Access denied");
    }

    // OWNER и EDITOR могут смотреть участников
    if (member.getRole() == TreeRole.VIEWER) {
      throw new SecurityException("View members permission required");
    }
  }

}
