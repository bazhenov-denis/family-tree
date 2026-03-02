package com.example.backend.graph.api;

import com.example.backend.graph.application.TreeGraphService;
import com.example.backend.graph.dto.TreeGraphDto;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/trees/{treeId}/graph")
public class TreeGraphController {

  private final TreeGraphService graphService;

  public TreeGraphController(TreeGraphService graphService) {
    this.graphService = graphService;
  }

  @GetMapping
  public TreeGraphDto graph(@PathVariable UUID treeId) {
    return graphService.getGraph(treeId);
  }
}

