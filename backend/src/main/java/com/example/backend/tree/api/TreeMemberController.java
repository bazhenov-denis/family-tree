package com.example.backend.tree.api;

import com.example.backend.tree.dto.AddTreeMemberRequest;
import com.example.backend.tree.dto.ChangeTreeMemberRoleRequest;
import com.example.backend.tree.dto.TreeMemberResponse;
import com.example.backend.tree.application.AddTreeMemberService;
import com.example.backend.tree.application.ChangeTreeMemberRoleService;
import com.example.backend.tree.application.GetTreeMembersService;
import com.example.backend.tree.application.RemoveTreeMemberService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/members")
public class TreeMemberController {

  private final ChangeTreeMemberRoleService changeTreeMemberRoleService;
  private final RemoveTreeMemberService removeTreeMemberService;
  private final GetTreeMembersService getTreeMembersService;
  private final AddTreeMemberService addTreeMemberService;




  public TreeMemberController(ChangeTreeMemberRoleService changeTreeMemberRoleService, RemoveTreeMemberService removeTreeMemberService,
      GetTreeMembersService getTreeMembersService, AddTreeMemberService addTreeMemberService
  ) {
    this.changeTreeMemberRoleService = changeTreeMemberRoleService;
    this.removeTreeMemberService = removeTreeMemberService;
    this.getTreeMembersService = getTreeMembersService;
    this.addTreeMemberService = addTreeMemberService;
  }


  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TreeMemberResponse add(
      @PathVariable UUID treeId,
      @RequestBody @Valid AddTreeMemberRequest request
  ) {
    return addTreeMemberService.add(treeId, request);
  }


  @GetMapping
  public List<TreeMemberResponse> listMembers(
      @PathVariable UUID treeId
  ) {
    return getTreeMembersService.list(treeId);
  }


  @PatchMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changeRole(
      @PathVariable UUID treeId,
      @PathVariable UUID userId,
      @RequestBody @Valid ChangeTreeMemberRoleRequest request
  ) {
    changeTreeMemberRoleService.changeRole(treeId, userId, request);
  }


  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeMember(
      @PathVariable UUID treeId,
      @PathVariable UUID userId
  ) {
    removeTreeMemberService.remove(treeId, userId);
  }

}
