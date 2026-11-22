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
    private String segredo;

    @Value("${jwt.expiration-ms}")
    private long expiracaoMs;

    public String gerarToken(Long idUsuario, String email) {
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + expiracaoMs);

        return Jwts.builder()
                .subject(String.valueOf(idUsuario))
                .claim("email", email)
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(obterChaveAssinatura())
                .compact();
    }

    public Long extrairIdUsuario(String token) {
        return Long.valueOf(extrairDeclaracao(token, Claims::getSubject));
    }

    public boolean tokenValido(String token) {
        try {
            return !tokenExpirado(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean tokenExpirado(String token) {
        return extrairDeclaracao(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extrairDeclaracao(String token, Function<Claims, T> extrator) {
        return extrator.apply(extrairTodasDeclaracoes(token));
    }

    private Claims extrairTodasDeclaracoes(String token) {
        return Jwts.parser()
                .verifyWith(obterChaveAssinatura())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey obterChaveAssinatura() {
        byte[] bytesChave = Decoders.BASE64.decode(segredo);
        return Keys.hmacShaKeyFor(bytesChave);
    }
}
