package com.example.backend.graph.domain;

import com.example.backend.graph.dto.PersonNodeDto;
import com.example.backend.graph.dto.PersonRow;
import com.example.backend.graph.dto.RelationEdgeDto;
import com.example.backend.graph.dto.RelationRow;
import com.example.backend.graph.dto.TreeGraphDto;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class GraphBuilder {

  private final GraphLayoutBuilder layoutBuilder;

  public GraphBuilder(GraphLayoutBuilder layoutBuilder) {
    this.layoutBuilder = layoutBuilder;
  }

  public TreeGraphDto build(
      List<PersonRow> persons,
      List<RelationRow> relations
  ) {

    Map<UUID, GraphLayoutBuilder.Layout> layout =
        layoutBuilder.buildLayout(persons, relations);

    List<PersonNodeDto> nodes = persons.stream()
        .map(p -> {
          var l = layout.get(p.getId());
          return new PersonNodeDto(
              p.getId(),
              p.getFullName(),
              p.getGender(),
              p.getBirthYear(),
              p.getDeathYear(),
              p.getPhotoUrl(),
              l.level(),
              l.order()
          );
        })
        .toList();

    List<RelationEdgeDto> edges = relations.stream()
        .map(r -> new RelationEdgeDto(
            r.getId(),
            r.getFromId(),
            r.getToId(),
            r.getType()
        ))
        .toList();

    return new TreeGraphDto(nodes, edges);
  }
}
