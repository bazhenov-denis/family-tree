package com.example.backend.tree.application;

import com.example.backend.event.repository.EventRepository;
import com.example.backend.media.repository.MediaRepository;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class GetTreeService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;
  private final PersonRepository personRepository;
  private final EventRepository eventRepository;
  private final MediaRepository mediaRepository;

  public GetTreeService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService,
      PersonRepository personRepository,
      EventRepository eventRepository,
      MediaRepository mediaRepository
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService = permissionService;
    this.personRepository = personRepository;
    this.eventRepository = eventRepository;
    this.mediaRepository = mediaRepository;
  }

  public TreeResponse get(UUID treeId) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = treeRepository.findById(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, currentUser)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanView(member);

    int personCount = personRepository.findAllByTreeId(treeId).size();
    int eventCount = eventRepository.findAllByTreeId(treeId).size();
    int mediaCount = mediaRepository.findAllByTreeIdOrderByCreatedAtAsc(treeId).size();

    return new TreeResponse(
        tree.getId(),
        tree.getTitle(),
        tree.getDescription(),
        tree.getCreatedAt(),
        tree.getUpdatedAt(),
        member.getRole().name(),
        personCount,
        eventCount,
        mediaCount
    );
  }
}

