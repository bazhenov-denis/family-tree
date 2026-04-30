package com.example.backend.comment.application;

import com.example.backend.auth.entity.User;
import com.example.backend.comment.dto.CommentRequest;
import com.example.backend.comment.dto.CommentResponse;
import com.example.backend.comment.entity.Comment;
import com.example.backend.comment.repository.CommentRepository;
import com.example.backend.person.entity.Person;
import com.example.backend.person.repository.PersonRepository;
import com.example.backend.security.CurrentUserProvider;
import com.example.backend.shared.exception.NotFoundException;
import com.example.backend.tree.domain.TreePermissionService;
import com.example.backend.tree.entity.FamilyTree;
import com.example.backend.tree.entity.TreeMember;
import com.example.backend.tree.entity.TreeRole;
import com.example.backend.tree.repository.FamilyTreeRepository;
import com.example.backend.tree.repository.TreeMemberRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CommentService {

  private static final String ENTITY_TYPE = "PERSON";

  private final CommentRepository commentRepository;
  private final PersonRepository personRepository;
  private final FamilyTreeRepository treeRepository;
  private final TreeMemberRepository memberRepository;
  private final CurrentUserProvider currentUserProvider;
  private final TreePermissionService permissionService;

  public CommentService(
      CommentRepository commentRepository,
      PersonRepository personRepository,
      FamilyTreeRepository treeRepository,
      TreeMemberRepository memberRepository,
      CurrentUserProvider currentUserProvider,
      TreePermissionService permissionService
  ) {
    this.commentRepository   = commentRepository;
    this.personRepository    = personRepository;
    this.treeRepository      = treeRepository;
    this.memberRepository    = memberRepository;
    this.currentUserProvider = currentUserProvider;
    this.permissionService   = permissionService;
  }

  public List<CommentResponse> list(UUID treeId, UUID personId) {
    User user = currentUserProvider.get();
    TreeMember member = resolveMember(treeId, user);
    permissionService.checkCanView(member);
    resolvePerson(treeId, personId);
    return commentRepository
        .findAllByEntityIdAndEntityTypeOrderByCreatedAtAsc(personId, ENTITY_TYPE)
        .stream()
        .map(c -> new CommentResponse(c, user.getId()))
        .toList();
  }

  public CommentResponse create(UUID treeId, UUID personId, CommentRequest req) {
    User user = currentUserProvider.get();
    TreeMember member = resolveMember(treeId, user);
    permissionService.checkCanComment(member);
    Person person = resolvePerson(treeId, personId);

    Comment comment = new Comment(
        member.getTree(), user, person.getId(), ENTITY_TYPE, req.getContent()
    );
    commentRepository.save(comment);
    return new CommentResponse(comment, user.getId());
  }

  public void delete(UUID treeId, UUID commentId) {
    User user = currentUserProvider.get();
    TreeMember member = resolveMember(treeId, user);

    Comment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new NotFoundException("Comment not found"));
    if (!comment.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }

    boolean isAuthor = comment.getAuthor().getId().equals(user.getId());
    boolean canManage = member.getRole() == TreeRole.OWNER
        || member.getRole() == TreeRole.EDITOR;
    if (!isAuthor && !canManage) {
      throw new SecurityException("Access denied");
    }
    commentRepository.delete(comment);
  }

  private TreeMember resolveMember(UUID treeId, User user) {
    FamilyTree tree = treeRepository.findByIdAndDeletedFalse(treeId)
        .orElseThrow(() -> new NotFoundException("Tree not found"));
    return memberRepository.findByTreeAndUser(tree, user)
        .orElseThrow(() -> new SecurityException("Access denied"));
  }

  private Person resolvePerson(UUID treeId, UUID personId) {
    Person person = personRepository.findById(personId)
        .orElseThrow(() -> new NotFoundException("Person not found"));
    if (!person.getTree().getId().equals(treeId)) {
      throw new SecurityException("Access denied");
    }
    return person;
  }
}
