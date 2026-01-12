package com.example.backend.service;


import com.example.backend.dto.tree.GraphMetaDto;
import com.example.backend.dto.tree.TreeDto;
import com.example.backend.dto.tree.TreeGraphDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

@Service
public class TreeGraphService {

  public TreeGraphDto getGraph(UUID treeId) {

    TreeDto tree = new TreeDto(
        treeId.toString(),
        "Demo Family Tree",
        "OWNER"
    );

    return new TreeGraphDto(
        tree,
        Collections.emptyList(),
        Collections.emptyList(),
        new GraphMetaDto(
            0,
            0,
            Instant.now()
        )
    );
  }
}

