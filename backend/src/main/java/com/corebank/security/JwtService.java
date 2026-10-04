package com.corebank.security;

import com.corebank.config.AppProperties;
import com.corebank.entity.User;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final AppProperties props;

    public JwtService(AppProperties props) {
        this.props = props;
    }

    public String generate(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("admin", user.isAdmin())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + props.getJwtExpirationMs()))
                .signWith(key())
                .compact();
    }

    public Long userId(String token) {
        String subject = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.valueOf(subject);
    }

    public boolean adminClaim(String token) {
        Object claim = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("admin");
        return Boolean.TRUE.equals(claim);
    }

    public boolean valid(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(props.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }
}
