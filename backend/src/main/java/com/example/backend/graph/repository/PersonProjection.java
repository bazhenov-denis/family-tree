package com.example.backend.graph.repository;

import java.sql.SQLException;
import java.util.UUID;

public interface PersonProjection {
  UUID getId() throws SQLException;
  String getFullName() throws SQLException;
  String getGender() throws SQLException;
  Integer getBirthYear() throws SQLException;
  Integer getDeathYear() throws SQLException;
}
