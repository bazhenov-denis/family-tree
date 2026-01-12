package com.example.backend.service;

import com.example.backend.dto.tree.CreateTreeRequest;
import com.example.backend.dto.tree.TreeResponse;
import com.example.backend.entity.FamilyTree;
import com.example.backend.entity.TreeMember;
import com.example.backend.entity.User;
import com.example.backend.repository.FamilyTreeRepository;
import com.example.backend.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class CreateTreeService {

  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;

  public CreateTreeService(
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.treeRepository = treeRepository;
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
  }

  @Transactional
  public TreeResponse create(CreateTreeRequest request) {

    User currentUser = currentUserProvider.get();

    FamilyTree tree = new FamilyTree(
        request.getTitle(),
        request.getDescription()
    );

    treeRepository.save(tree);

    TreeMember owner = TreeMember.owner(tree, currentUser);
    memberRepository.save(owner);

    return new TreeResponse(
        tree.getId(),
        tree.getTitle(),
        tree.getDescription(),
        tree.getCreatedAt(),
        owner.getRole().name()
    );
  }
}

