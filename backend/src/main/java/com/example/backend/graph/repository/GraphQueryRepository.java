package com.example.backend.graph.repository;

import com.example.backend.graph.dto.PersonRow;
import com.example.backend.graph.dto.RelationRow;
import java.util.List;
import java.util.UUID;

public interface GraphQueryRepository {

  List<PersonRow> findAllPersons(UUID treeId);

  List<RelationRow> findAllRelations(UUID treeId);
}
