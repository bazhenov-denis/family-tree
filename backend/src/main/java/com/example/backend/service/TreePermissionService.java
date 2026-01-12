package com.example.backend.service;

import com.example.backend.entity.TreeMember;
import com.example.backend.enums.TreeRole;
import org.springframework.stereotype.Service;

@Service
public class TreePermissionService {

  public void checkCanView(TreeMember member) {
    // VIEWER, EDITOR, OWNER — все могут смотреть
    if (member == null) {
      throw new SecurityException("Access denied");
    }
  }

  public void checkCanEdit(TreeMember member) {
    if (member == null) {
      throw new SecurityException("Access denied");
    }

    if (member.getRole() == TreeRole.VIEWER) {
      throw new SecurityException("Edit permission required");
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
