package wisepath.code.controller;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import wisepath.code.dto.AtualizarUsuarioDTO;
import wisepath.code.dto.LoginDTO;
import wisepath.code.dto.LoginRespostaDTO;
import wisepath.code.dto.UsuarioDTO;
import wisepath.code.dto.UsuarioRespostaDTO;
import wisepath.code.entity.Usuario;
import wisepath.code.security.JwtService;
import wisepath.code.service.UsuarioService;


@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;
    private final JwtService jwtService;

    public UsuarioController(UsuarioService usuarioService, JwtService jwtService) {
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<UsuarioRespostaDTO> cadastrar(@RequestBody @Valid UsuarioDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(dto.senha());

        Usuario usuarioCadastrado = usuarioService.cadastrar(usuario);

        URI uri = URI.create("/usuarios/" + usuarioCadastrado.getIdUsuario());
        return ResponseEntity.created(uri).body(UsuarioRespostaDTO.deEntidade(usuarioCadastrado));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginRespostaDTO> autenticar(@RequestBody @Valid LoginDTO dto){
        Usuario usuario = usuarioService.autenticar(dto.email(), dto.senha());
        String token = jwtService.gerarToken(usuario.getIdUsuario(), usuario.getEmail());
        return ResponseEntity.ok(LoginRespostaDTO.criar(usuario, token));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioRespostaDTO> buscarPorId(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id){
        
        verificarProprioUsuario(id, usuarioLogado);
        Usuario usuario = usuarioService.buscarPorId(id);
        return ResponseEntity.ok(UsuarioRespostaDTO.deEntidade(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioRespostaDTO> atualizarPerfil(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id, @RequestBody @Valid AtualizarUsuarioDTO dto){

        verificarProprioUsuario(id, usuarioLogado);
        Usuario usuarioAtualizado = usuarioService.atualizarPerfil(id,
             dto.nome(), dto.email(), dto.senha());
        return ResponseEntity.ok(UsuarioRespostaDTO.deEntidade(usuarioAtualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirConta(@AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long id) {
            
        verificarProprioUsuario(id, usuarioLogado);
        usuarioService.excluirConta(id);
        return ResponseEntity.noContent().build();
    }

    private void verificarProprioUsuario(Long id, Usuario usuarioLogado) {
        if (!id.equals(usuarioLogado.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode acessar ou alterar o seu próprio perfil.");
        }
    }
}