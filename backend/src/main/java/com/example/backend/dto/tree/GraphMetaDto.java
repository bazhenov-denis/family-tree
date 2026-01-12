package com.example.backend.dto.tree;

import java.time.Instant;

public class GraphMetaDto {

  private int personsCount;
  private int relationshipsCount;
  private Instant generatedAt;

  public GraphMetaDto(int personsCount, int relationshipsCount, Instant generatedAt) {
    this.personsCount = personsCount;
    this.relationshipsCount = relationshipsCount;
    this.generatedAt = generatedAt;
  }

  public int getPersonsCount() {
    return personsCount;
  }

  public int getRelationshipsCount() {
    return relationshipsCount;
  }

  public Instant getGeneratedAt() {
    return generatedAt;
  }
}
