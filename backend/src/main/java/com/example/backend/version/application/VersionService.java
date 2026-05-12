package com.example.backend.version.application;

import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.version.dto.SnapshotPreviewResponse;
import com.example.backend.version.dto.VersionResponse;
import com.example.backend.version.dto.WorkingCopyContextResponse;
import com.example.backend.version.entity.VersionType;
import com.example.backend.version.entity.Version;
import com.example.backend.version.entity.VersionState;
import com.example.backend.version.repository.VersionEntityRepository;
import com.example.backend.version.repository.VersionRepository;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
  private final ObjectMapper objectMapper;

  public VersionService(
      VersionRepository versionRepository,
      VersionEntityRepository versionEntityRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      TreePermissionService permissionService,
      CurrentUserProvider currentUserProvider,
      ObjectMapper objectMapper
  ) {
    this.versionRepository = versionRepository;
    this.versionEntityRepository = versionEntityRepository;
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.permissionService = permissionService;
    this.currentUserProvider = currentUserProvider;
    this.objectMapper = objectMapper;
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

  public SnapshotPreviewResponse getVersionPreview(UUID treeId, UUID versionId) {
    TreeMember member = resolveMember(treeId);
    permissionService.checkCanView(member);

    Version version = versionRepository.findByIdAndTreeId(versionId, treeId)
        .orElseThrow(() -> new NotFoundException("Version not found"));

    List<com.example.backend.version.entity.VersionEntity> entities =
        versionEntityRepository.findAllByVersionId(version.getId());

    List<Map<String, Object>> persons = new ArrayList<>();
    List<Map<String, Object>> relationships = new ArrayList<>();
    List<Map<String, Object>> events = new ArrayList<>();
    List<Map<String, Object>> media = new ArrayList<>();

    for (com.example.backend.version.entity.VersionEntity ve : entities) {
      if (ve.getEntityData() == null) continue;
      try {
        @SuppressWarnings("unchecked")
        Map<String, Object> data = objectMapper.readValue(ve.getEntityData(), Map.class);
        switch (ve.getEntityType()) {
          case "PERSON" -> persons.add(data);
          case "RELATIONSHIP" -> relationships.add(data);
          case "EVENT" -> events.add(data);
          case "MEDIA" -> media.add(data);
        }
      } catch (Exception ignored) {}
    }

    return new SnapshotPreviewResponse(persons, relationships, events, media);
  }

  public WorkingCopyContextResponse getWorkingCopyContext(UUID clonedTreeId) {
    return versionRepository.findByClonedTreeId(clonedTreeId)
        .filter(v -> v.getType() == VersionType.WORKING_COPY)
        .map(v -> new WorkingCopyContextResponse(
            v.getTree().getId(),
            v.getId(),
            v.getName(),
            v.getDescription(),
            v.getState().name()
        ))
        .orElse(null);
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
    VersionResponse resp = new VersionResponse(
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
    resp.setClonedTreeId(v.getClonedTreeId());
    return resp;
  }
}
