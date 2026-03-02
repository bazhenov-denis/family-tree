package com.example.backend.security;

import com.example.backend.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;


import java.util.Date;

@Component
public class JwtTokenProvider {

  @Value("${jwt.secret}")
  private String jwtSecret;

  @Value("${jwt.expiration-ms:3600000}") // 1 час
  private long jwtExpirationMs;

  public String generateToken(User user) {

    Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

    Date now = new Date();
    Date expiry = new Date(now.getTime() + jwtExpirationMs);

    return Jwts.builder()
        .setSubject(user.getId().toString())
        .claim("email", user.getEmail())
        .setIssuedAt(now)
        .setExpiration(expiry)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public UUID getUserIdFromToken(String token) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
        .build()
        .parseClaimsJws(token)
        .getBody();

    return UUID.fromString(claims.getSubject());
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }


}
