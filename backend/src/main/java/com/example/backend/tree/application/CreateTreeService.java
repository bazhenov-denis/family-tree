package com.example.backend.tree.application;

import com.example.backend.tree.dto.CreateTreeRequest;
import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
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
    tree.setOwner(currentUser);

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

