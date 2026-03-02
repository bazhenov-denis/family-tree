package com.example.backend.tree.api;


import com.example.backend.tree.dto.CreateTreeRequest;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.dto.UpdateTreeRequest;
import com.example.backend.tree.application.CreateTreeService;
import com.example.backend.tree.application.DeleteTreeService;
import com.example.backend.tree.application.GetTreeService;
import com.example.backend.tree.application.GetUserTreesService;
import com.example.backend.tree.application.UpdateTreeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trees")
public class TreeController {

  private final CreateTreeService createTreeService;
  private final GetUserTreesService getUserTreesService;
  private final GetTreeService getTreeService;
  private final UpdateTreeService updateTreeService;
  private final DeleteTreeService deleteTreeService;



  public TreeController(CreateTreeService createTreeService, GetUserTreesService getUserTreesService, GetTreeService getTreeService,
      UpdateTreeService updateTreeService, DeleteTreeService deleteTreeService
  ) {
    this.createTreeService = createTreeService;
    this.getUserTreesService = getUserTreesService;
    this.getTreeService = getTreeService;
    this.updateTreeService = updateTreeService;
    this.deleteTreeService = deleteTreeService;
  }

  @PostMapping
  public TreeResponse createTree(@RequestBody @Valid CreateTreeRequest request) {
    return createTreeService.create(request);
  }

  @GetMapping
  public List<TreeResponse> getMyTrees() {
    return getUserTreesService.getMyTrees();
  }

  @GetMapping("/{treeId}")
  public TreeResponse getTree(@PathVariable UUID treeId) {
    return getTreeService.get(treeId);
  }

  @PatchMapping("/{treeId}")
  public TreeResponse updateTree(
      @PathVariable UUID treeId,
      @RequestBody @Valid UpdateTreeRequest request
  ) {
    return updateTreeService.update(treeId, request);
  }

  @DeleteMapping("/{treeId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTree(@PathVariable UUID treeId) {
    deleteTreeService.delete(treeId);
  }


}
