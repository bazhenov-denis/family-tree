package com.example.backend.graph.application;

import com.example.backend.auth.entity.User;
import com.example.backend.graph.domain.GraphBuilder;
import com.example.backend.graph.dto.TreeGraphDto;
import com.example.backend.graph.repository.GraphQueryRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TreeGraphService {

  private final GraphQueryRepository graphRepository;
  private final TreePermissionService permissionService;
  private final TreeMemberRepository memberRepository;
  private final FamilyTreeRepository treeRepository;
  private final CurrentUserProvider currentUserProvider;
  private final GraphBuilder graphBuilder;

  public TreeGraphService(
      GraphQueryRepository graphRepository,
      TreePermissionService permissionService,
      TreeMemberRepository memberRepository,
      FamilyTreeRepository treeRepository,
      CurrentUserProvider currentUserProvider,
      GraphBuilder graphBuilder
  ) {
    this.graphRepository = graphRepository;
    this.permissionService = permissionService;
    this.memberRepository = memberRepository;
    this.treeRepository = treeRepository;
    this.currentUserProvider = currentUserProvider;
    this.graphBuilder = graphBuilder;
  }

  public TreeGraphDto getGraph(UUID treeId) {

    User user = currentUserProvider.get();

    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new com.example.backend.shared.exception.NotFoundException("Tree not found"));

    TreeMember member = memberRepository
        .findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));

    permissionService.checkCanView(member);

    return graphBuilder.build(
        graphRepository.findAllPersons(treeId),
        graphRepository.findAllRelations(treeId)
    );
  }
}
