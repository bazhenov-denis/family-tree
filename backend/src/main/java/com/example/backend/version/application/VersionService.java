package com.example.backend.version.application;

import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionState;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VersionService {

  private final VersionRepository versionRepository;
  private final VersionEntityRepository versionEntityRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final TreePermissionService permissionService;
  private final CurrentUserProvider currentUserProvider;

  public VersionService(
      VersionRepository versionRepository,
      VersionEntityRepository versionEntityRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      TreePermissionService permissionService,
      CurrentUserProvider currentUserProvider
  ) {
    this.versionRepository = versionRepository;
    this.versionEntityRepository = versionEntityRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.permissionService = permissionService;
    this.currentUserProvider = currentUserProvider;
  }

  public List<VersionResponse> listVersions(UUID treeId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);

    return versionRepository.findAllByTreeIdAndStateOrderByCreatedAtDesc(treeId, VersionState.ACTIVE)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  public VersionResponse getVersion(UUID treeId, UUID versionId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);

    Version version = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));
    return toResponse(version);
  }

  @Transactional
  public void deleteVersion(UUID treeId, UUID versionId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanManage(member);

    Version version = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));

    if (version.getType() == com.example.backend.version.entity.VersionType.MAIN) {
      throw new IllegalStateException("Cannot delete main version");
    }

    version.setState(VersionState.DISCARDED);
    versionEntityRepository.deleteAllByVersionId(version.getId());
  }

  public Version resolveVersion(UUID treeId, UUID versionId) {
    return versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));
  }

  protected TreeMember resolveMember(UUID treeId) {
    User user = currentUserProvider.get();
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private VersionResponse toResponse(Version v) {
    int count = versionEntityRepository.findAllByVersionId(v.getId()).size();
    return new VersionResponse(
        v.getId(),
        v.getName(),
        v.getDescription(),
        v.getType().name(),
        v.getState().name(),
        v.getParentId(),
        v.getBaseSnapshotId(),
        v.getCreatedAt(),
        v.getCreatedBy() != null ? v.getCreatedBy().getEmail() : null,
        count
    );
  }
}
