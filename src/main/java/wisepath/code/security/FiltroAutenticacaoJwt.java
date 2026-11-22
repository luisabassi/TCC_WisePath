package wisepath.code.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import wisepath.code.repository.UsuarioRepository;

@Component
public class FiltroAutenticacaoJwt extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public FiltroAutenticacaoJwt(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requisicao,
                                    HttpServletResponse resposta,
                                    FilterChain cadeiaFiltros) throws ServletException, IOException {

        String cabecalhoAutorizacao = requisicao.getHeader("Authorization");

        if (cabecalhoAutorizacao == null || !cabecalhoAutorizacao.startsWith(PREFIXO_BEARER)) {
            cadeiaFiltros.doFilter(requisicao, resposta);
            return;
        }

        String token = cabecalhoAutorizacao.substring(PREFIXO_BEARER.length());

        if (jwtService.tokenValido(token)) {
            Long idUsuario = jwtService.extrairIdUsuario(token);

            usuarioRepository.findById(idUsuario).ifPresent(usuario -> {
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(usuario, null, List.of()));
            });
        }

        cadeiaFiltros.doFilter(requisicao, resposta);
    }
}
