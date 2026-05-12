package com.example.backend.tree.invite.application;

import com.example.backend.shared.email.EmailSender;
import com.example.backend.tree.invite.entity.InviteToken;
import com.example.backend.tree.invite.entity.TreeInvite;
import com.example.backend.tree.invite.repository.InviteTokenRepository;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SendInviteEmailService {

  private static final Logger log = LoggerFactory.getLogger(SendInviteEmailService.class);

  private final InviteTokenRepository tokenRepository;
  private final EmailSender emailSender;
  private final String appUrl;

  public SendInviteEmailService(
      InviteTokenRepository tokenRepository,
      EmailSender emailSender,
      @Value("${app.url}") String appUrl
  ) {
    this.tokenRepository = tokenRepository;
    this.emailSender = emailSender;
    this.appUrl = appUrl;
  }

  @Transactional
  public void send(TreeInvite invite) {

    InviteToken token = InviteToken.create(invite, Duration.ofDays(7));
    tokenRepository.save(token);

    String link = appUrl + "/invite/" + token.getToken();

    String body = """
                Вас пригласили в семейное дерево "%s"
                Роль: %s

                Перейти по ссылке:
                %s

                Ссылка действует 7 дней.
                """.formatted(
        invite.getTree().getTitle(),
        invite.getRole().name(),
        link
    );

    try {
      emailSender.send(
          invite.getEmail(),
          "Приглашение в семейное дерево",
          body
      );
    } catch (Exception e) {
      log.error("Failed to send invite email to {}: {}", invite.getEmail(), e.getMessage());
    }
  }
}
