package com.example.backend.controller;

import com.example.backend.dto.tree.TreeGraphDto;
import com.example.backend.service.TreeGraphService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/trees")
public class TreeGraphController {

  private final TreeGraphService treeGraphService;

  public TreeGraphController(TreeGraphService treeGraphService) {
    this.treeGraphService = treeGraphService;
  }

  @GetMapping("/{treeId}/graph")
  public TreeGraphDto getGraph(@PathVariable UUID treeId) {
    return treeGraphService.getGraph(treeId);
  }
}

