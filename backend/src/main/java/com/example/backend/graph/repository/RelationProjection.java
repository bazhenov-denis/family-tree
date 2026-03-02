package com.example.backend.graph.repository;

import java.sql.SQLException;
import java.util.UUID;

public interface RelationProjection {
  UUID getFromId() throws SQLException;
  UUID getToId() throws SQLException;
  String getType() throws SQLException;
}

