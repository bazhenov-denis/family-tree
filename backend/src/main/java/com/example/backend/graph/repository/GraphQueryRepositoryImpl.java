package com.example.backend.graph.repository;


import com.example.backend.graph.dto.PersonRow;
import com.example.backend.graph.dto.RelationRow;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class GraphQueryRepositoryImpl implements GraphQueryRepository {

  private final NamedParameterJdbcTemplate jdbc;

  public GraphQueryRepositoryImpl(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public List<PersonRow> findAllPersons(UUID treeId) {

    String sql = """
            select
                p.id,
                trim(concat(p.first_name, ' ', p.last_name)) as full_name,
                p.gender,
                extract(year from p.birth_date)::int as birth_year,
                extract(year from p.death_date)::int as death_year,
                p.photo_url
            from person p
            where p.tree_id = :treeId
        """;

    return jdbc.query(
        sql,
        Map.of("treeId", treeId),
        (rs, rowNum) -> new PersonRow(
            rs.getObject("id", UUID.class),
            rs.getString("full_name"),
            rs.getString("gender"),
            rs.getObject("birth_year", Integer.class),
            rs.getObject("death_year", Integer.class),
            rs.getString("photo_url")
        )
    );
  }

  @Override
  public List<RelationRow> findAllRelations(UUID treeId) {

    String sql = """
            select
                r.id,
                r.from_person_id,
                r.to_person_id,
                r.type
            from relationship r
            where r.tree_id = :treeId
        """;

    return jdbc.query(
        sql,
        Map.of("treeId", treeId),
        (rs, rowNum) -> new RelationRow(
            rs.getObject("id", UUID.class),
            rs.getObject("from_person_id", UUID.class),
            rs.getObject("to_person_id", UUID.class),
            rs.getString("type")
        )
    );
  }
}
