package com.example.backend.graph.dto;

import java.util.List;

public class TreeGraphDto {

  private List<PersonNodeDto> nodes;
  private List<RelationEdgeDto> edges;

  public TreeGraphDto(
      List<PersonNodeDto> nodes,
      List<RelationEdgeDto> edges
  ) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public List<PersonNodeDto> getNodes() {
    return nodes;
  }

  public List<RelationEdgeDto> getEdges() {
    return edges;
  }
}
