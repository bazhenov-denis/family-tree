package com.example.backend.tree.invite.api;

import com.example.backend.tree.invite.application.GetMyInvitesService;
import com.example.backend.tree.invite.dto.TreeInviteResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class MyInvitesController {

  private final GetMyInvitesService getMyInvitesService;

  public MyInvitesController(GetMyInvitesService getMyInvitesService) {
    this.getMyInvitesService = getMyInvitesService;
  }

  @GetMapping("/api/my/invites")
  public List<TreeInviteResponse> myInvites() {
    return getMyInvitesService.getMyInvites();
  }
}
