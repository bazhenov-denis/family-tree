package com.example.backend.audit.application;

import com.example.backend.audit.dto.AuditLogResponse;
import com.example.backend.audit.entity.AuditLog;
import com.example.backend.audit.repository.AuditLogRepository;
import com.example.backend.auth.entity.User;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

  private final AuditLogRepository auditLogRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public AuditService(
      AuditLogRepository auditLogRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.auditLogRepository = auditLogRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
  }

  /** Lists the most recent audit entries for a tree. */
  public List<AuditLogResponse> list(UUID treeId, int size) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);
    return auditLogRepository
        .findAllByTreeIdOrderByCreatedAtDesc(treeId, PageRequest.of(0, size))
        .stream()
        .map(AuditLogResponse::new)
        .toList();
  }

  /** Records an audit event. Called internally by other services. */
  public void record(FamilyTree tree, User user,
      String entityType, UUID entityId,
      String action, String beforeState, String afterState) {
    auditLogRepository.save(
        new AuditLog(tree, user, entityType, entityId, action, beforeState, afterState));
  }

  // ─── JSON helper ──────────────────────────────────────────────────────────

  /** Builds a minimal {"desc":"..."} JSON string. */
  public static String descJson(String desc) {
    return "{\"desc\":\"" + escape(desc) + "\"}";
  }

  private static String escape(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  // ─── Auth helper ──────────────────────────────────────────────────────────

  private TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }
}
