package wisepath.code.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import wisepath.code.controller.SpaController;
import wisepath.code.security.FiltroAutenticacaoJwt;

@Configuration
public class ConfiguracaoSeguranca {

    private final FiltroAutenticacaoJwt filtroAutenticacaoJwt;

    public ConfiguracaoSeguranca(FiltroAutenticacaoJwt filtroAutenticacaoJwt) {
        this.filtroAutenticacaoJwt = filtroAutenticacaoJwt;
    }

    @Bean
    PasswordEncoder codificadorSenha() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain cadeiaFiltros(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(autorizacao -> autorizacao
                .requestMatchers(HttpMethod.POST, "/usuarios", "/usuarios/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/css/**", "/js/**", "/views/**",
                        "/assets/**", "/favicon.ico", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, SpaController.ROTAS_FRONT).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(filtroAutenticacaoJwt, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
