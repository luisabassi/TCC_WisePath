package wisepath.code.security;

import java.util.Date;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    public String gerarToken(Long idUsuario, String email) {
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(idUsuario))
                .claim("email", email)
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(getSigningKey())
                .compact();
    }

    public Long extrairIdUsuario(String token) {
        return Long.valueOf(extrairClaim(token, Claims::getSubject));
    }

    public boolean tokenValido(String token) {
        try {
            return !tokenExpirado(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean tokenExpirado(String token) {
        return extrairClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extrairClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extrairTodasClaims(token));
    }

    private Claims extrairTodasClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}