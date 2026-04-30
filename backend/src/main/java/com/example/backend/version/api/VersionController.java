package com.example.backend.version.api;

import com.example.backend.version.application.MergeService;
import com.example.backend.version.application.SnapshotService;
import com.example.backend.version.application.VersionService;
import com.example.backend.version.application.WorkingCopyService;
import com.example.backend.version.dto.CreateSnapshotRequest;
import com.example.backend.version.dto.CreateWorkingCopyRequest;
import com.example.backend.version.dto.MergeConflict;
import com.example.backend.version.dto.ResolveConflictRequest;
import com.example.backend.version.dto.VersionResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/versions")
public class VersionController {

  private final VersionService versionService;
  private final SnapshotService snapshotService;
  private final WorkingCopyService workingCopyService;
  private final MergeService mergeService;

  public VersionController(
      VersionService versionService,
      SnapshotService snapshotService,
      WorkingCopyService workingCopyService,
      MergeService mergeService
  ) {
    this.versionService = versionService;
    this.snapshotService = snapshotService;
    this.workingCopyService = workingCopyService;
    this.mergeService = mergeService;
  }

  // ─── List / Get / Delete ───────────────────────────────────────────────────

  @GetMapping
  public List<VersionResponse> listVersions(@PathVariable UUID treeId) {
    return versionService.listVersions(treeId);
  }

  @GetMapping("/{versionId}")
  public VersionResponse getVersion(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    return versionService.getVersion(treeId, versionId);
  }

  @DeleteMapping("/{versionId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteVersion(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    versionService.deleteVersion(treeId, versionId);
  }

  // ─── Snapshots ─────────────────────────────────────────────────────────────

  @PostMapping("/snapshot")
  @ResponseStatus(HttpStatus.CREATED)
  public VersionResponse createSnapshot(@PathVariable UUID treeId,
                                        @RequestBody CreateSnapshotRequest req) {
    return snapshotService.createSnapshot(treeId, req);
  }

  // ─── Working Copies ────────────────────────────────────────────────────────

  @PostMapping("/working-copy")
  @ResponseStatus(HttpStatus.CREATED)
  public VersionResponse createWorkingCopy(@PathVariable UUID treeId,
                                           @RequestBody CreateWorkingCopyRequest req) {
    return workingCopyService.createWorkingCopy(treeId, req);
  }

  @PostMapping("/{versionId}/discard")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void discardWorkingCopy(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    workingCopyService.discardWorkingCopy(treeId, versionId);
  }

  // ─── Merge ─────────────────────────────────────────────────────────────────

  @PostMapping("/{versionId}/merge/initiate")
  public List<MergeConflict> initiateMerge(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    return mergeService.getConflicts(treeId, versionId);
  }

  @GetMapping("/{versionId}/merge/conflicts")
  public List<MergeConflict> getConflicts(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    return mergeService.getConflicts(treeId, versionId);
  }

  @PostMapping("/{versionId}/merge/resolve")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void resolveConflict(@PathVariable UUID treeId,
                              @PathVariable UUID versionId,
                              @RequestBody ResolveConflictRequest req) {
    mergeService.resolveConflict(treeId, versionId, req);
  }

  @PostMapping("/{versionId}/merge/complete")
  public VersionResponse completeMerge(@PathVariable UUID treeId, @PathVariable UUID versionId) {
    return mergeService.completeMerge(treeId, versionId);
  }
}
