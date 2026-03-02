package com.example.backend.tree.invite.api;

import com.example.backend.tree.invite.application.AcceptTreeInviteService;
import com.example.backend.tree.invite.application.CreateTreeInviteService;
import com.example.backend.tree.invite.application.DeclineTreeInviteService;
import com.example.backend.tree.invite.dto.CreateTreeInviteRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees/{treeId}/invites")
public class TreeInviteController {

  private final CreateTreeInviteService createTreeInviteService;
  private final AcceptTreeInviteService acceptTreeInviteService;
  private final DeclineTreeInviteService declineTreeInviteService;



  public TreeInviteController(CreateTreeInviteService createTreeInviteService, AcceptTreeInviteService acceptTreeInviteService,
      DeclineTreeInviteService declineTreeInviteService
  ) {
    this.createTreeInviteService = createTreeInviteService;
    this.acceptTreeInviteService = acceptTreeInviteService;
    this.declineTreeInviteService = declineTreeInviteService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public void create(
      @PathVariable UUID treeId,
      @RequestBody @Valid CreateTreeInviteRequest request
  ) {
    createTreeInviteService.create(treeId, request);
  }

  @PostMapping("/{inviteId}/accept")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void accept(@PathVariable UUID inviteId) {
    acceptTreeInviteService.accept(inviteId);
  }

  @PostMapping("/{inviteId}/decline")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void decline(@PathVariable UUID inviteId) {
    declineTreeInviteService.decline(inviteId);
  }

}
