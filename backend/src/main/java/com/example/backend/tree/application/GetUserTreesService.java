package com.example.backend.tree.application;

import com.example.backend.event.repository.EventRepository;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GetUserTreesService {

  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final PersonRepository personRepository;
  private final EventRepository eventRepository;
  private final MediaRepository mediaRepository;

  public GetUserTreesService(
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      PersonRepository personRepository,
      EventRepository eventRepository,
      MediaRepository mediaRepository
  ) {
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.personRepository = personRepository;
    this.eventRepository = eventRepository;
    this.mediaRepository = mediaRepository;
  }

  public List<TreeResponse> getMyTrees() {

    User currentUser = currentUserProvider.get();

    List<TreeMember> memberships =
        memberRepository.findAllByUserAndTreeDeletedFalse(currentUser);

    List<UUID> treeIds = memberships.stream()
        .map(m -> m.getTree().getId())
        .toList();

    Map<UUID, Integer> personCounts = countMap(personRepository.countPersonsByTreeIds(treeIds));
    Map<UUID, Integer> eventCounts = countMap(eventRepository.countEventsByTreeIds(treeIds));
    Map<UUID, Integer> mediaCounts = countMap(mediaRepository.countMediaByTreeIds(treeIds));

    return memberships.stream()
        .map(m -> toResponse(m, personCounts, eventCounts, mediaCounts))
        .toList();
  }

  private Map<UUID, Integer> countMap(List<Object[]> rows) {
    Map<UUID, Integer> map = new HashMap<>();
    for (Object[] row : rows) {
      map.put((UUID) row[0], ((Number) row[1]).intValue());
    }
    return map;
  }

  private TreeResponse toResponse(TreeMember member,
                                  Map<UUID, Integer> personCounts,
                                  Map<UUID, Integer> eventCounts,
                                  Map<UUID, Integer> mediaCounts) {
    UUID treeId = member.getTree().getId();
    return new TreeResponse(
        treeId,
        member.getTree().getTitle(),
        member.getTree().getDescription(),
        member.getTree().getCreatedAt(),
        member.getTree().getUpdatedAt(),
        member.getRole().name(),
        personCounts.getOrDefault(treeId, 0),
        eventCounts.getOrDefault(treeId, 0),
        mediaCounts.getOrDefault(treeId, 0)
    );
  }
}
