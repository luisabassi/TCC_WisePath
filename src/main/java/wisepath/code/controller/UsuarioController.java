package wisepath.code.controller;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import jakarta.validation.Valid;
import wisepath.code.dto.LoginDTO;
import wisepath.code.dto.UsuarioDTO;
import wisepath.code.dto.UsuarioResponseDTO;
import wisepath.code.dto.LoginResponseDTO;
import wisepath.code.entity.Usuario;
import wisepath.code.security.JwtService;
import wisepath.code.service.UsuarioService;


@RestController
@RequestMapping("/users")
public class UsuarioController {
    private final UsuarioService usuarioService;  
    private final JwtService jwtService;

    public UsuarioController(UsuarioService usuarioService, JwtService jwtService){
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> cadastrar (@RequestBody
         @Valid UsuarioDTO dto){
        Usuario usuario = new Usuario(); 
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(dto.senha());

        Usuario usuarioCadastrado = usuarioService.cadastrar(usuario);

        URI uri = URI.create("/users/" + usuarioCadastrado.getIdUsuario());
        // URI -> serve para representar e manipular endereços de recursos na web ou em APIs
        return ResponseEntity.created(uri).body
        (UsuarioResponseDTO.fromEntity(usuarioCadastrado));
        //Status 201 (usuário foi criado) e depois diz o endereço desse recurso
        //O Body entrega os dados do que foi criado
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> autenticar(@RequestBody @Valid LoginDTO dto){
        Usuario usuario = usuarioService.autenticar(dto.email(), dto.senha());
        String token = jwtService.gerarToken(usuario.getIdUsuario(), usuario.getEmail());
        return ResponseEntity.ok(LoginResponseDTO.of(usuario, token));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorID(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id){
        
        verificarProprioUsuario(id, usuarioLogado);
        Usuario usuario = usuarioService.buscarPorId(id);
        return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizarPerfil(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id, @RequestBody UsuarioDTO dto){

        verificarProprioUsuario(id, usuarioLogado);
        Usuario usuarioAtualizado = usuarioService.atualizarPerfil(id,
             dto.nome(), dto.email(), dto.senha());
        return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(usuarioAtualizado));
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
