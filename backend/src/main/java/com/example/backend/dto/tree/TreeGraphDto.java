package com.example.backend.dto.tree;

import java.util.List;

public class TreeGraphDto {

  private TreeDto tree;
  private List<PersonGraphDto> persons;
  private List<RelationshipGraphDto> relationships;
  private GraphMetaDto meta;

  public TreeGraphDto(
      TreeDto tree,
      List<PersonGraphDto> persons,
      List<RelationshipGraphDto> relationships,
      GraphMetaDto meta
  ) {
    this.tree = tree;
    this.persons = persons;
    this.relationships = relationships;
    this.meta = meta;
  }

  public TreeDto getTree() {
    return tree;
  }

  public List<PersonGraphDto> getPersons() {
    return persons;
  }

  public List<RelationshipGraphDto> getRelationships() {
    return relationships;
  }

  public GraphMetaDto getMeta() {
    return meta;
  }
}
