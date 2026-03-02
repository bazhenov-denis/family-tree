package com.example.backend.graph.domain;


import com.example.backend.graph.dto.PersonRow;
import com.example.backend.graph.dto.RelationRow;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class GraphLayoutBuilder {

  public Map<UUID, Layout> buildLayout(
      List<PersonRow> persons,
      List<RelationRow> relations
  ) {

    Map<UUID, List<UUID>> parentsMap = new HashMap<>();
    Map<UUID, List<UUID>> childrenMap = new HashMap<>();

    // 1️⃣ строим parent/child map
    for (RelationRow r : relations) {
      if ("PARENT".equals(r.getType())) {
        parentsMap
            .computeIfAbsent(r.getToId(), k -> new ArrayList<>())
            .add(r.getFromId());

        childrenMap
            .computeIfAbsent(r.getFromId(), k -> new ArrayList<>())
            .add(r.getToId());
      }
    }

    // 2️⃣ корни — люди без родителей
    Set<UUID> roots = persons.stream()
        .map(PersonRow::getId)
        .filter(id -> !parentsMap.containsKey(id))
        .collect(Collectors.toSet());

    Map<UUID, Integer> levels = new HashMap<>();
    Queue<UUID> queue = new LinkedList<>();

    roots.forEach(root -> {
      levels.put(root, 0);
      queue.add(root);
    });

    // 3️⃣ BFS — считаем поколения
    while (!queue.isEmpty()) {
      UUID parent = queue.poll();
      int level = levels.get(parent);

      for (UUID child : childrenMap.getOrDefault(parent, List.of())) {
        if (!levels.containsKey(child)) {
          levels.put(child, level + 1);
          queue.add(child);
        }
      }
    }

    // 4️⃣ группируем по поколениям
    Map<Integer, List<PersonRow>> byLevel = new HashMap<>();

    for (PersonRow p : persons) {
      int lvl = levels.getOrDefault(p.getId(), 0);
      byLevel.computeIfAbsent(lvl, k -> new ArrayList<>()).add(p);
    }

    // 5️⃣ порядок внутри поколения
    Map<UUID, Layout> result = new HashMap<>();

    for (var entry : byLevel.entrySet()) {
      List<PersonRow> list = entry.getValue();

      list.sort(Comparator.comparing(
          PersonRow::getBirthYear,
          Comparator.nullsLast(Integer::compareTo)
      ));

      for (int i = 0; i < list.size(); i++) {
        result.put(
            list.get(i).getId(),
            new Layout(entry.getKey(), i)
        );
      }
    }

    return result;
  }

  public record Layout(int level, int order) {}
}
