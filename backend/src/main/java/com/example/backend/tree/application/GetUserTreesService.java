package com.example.backend.tree.application;

import com.example.backend.tree.dto.TreeResponse;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.auth.entity.User;
import com.example.backend.tree.repository.TreeMemberRepository;
import com.example.backend.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetUserTreesService {

  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;

  public GetUserTreesService(
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider
  ) {
    this.memberRepository = memberRepository;
    this.currentUserProvider = currentUserProvider;
  }

  public List<TreeResponse> getMyTrees() {

    User currentUser = currentUserProvider.get();

    List<TreeMember> memberships =
        memberRepository.findAllByUserAndTreeDeletedFalse(currentUser);

    return memberships.stream()
        .map(this::toResponse)
        .toList();
  }

  private TreeResponse toResponse(TreeMember member) {
    return new TreeResponse(
        member.getTree().getId(),
        member.getTree().getTitle(),
        member.getTree().getDescription(),
        member.getTree().getCreatedAt(),
        member.getRole().name()
    );
  }
}
