package wisepath.code.controller;

import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import wisepath.code.dto.LoginDTO;
import wisepath.code.dto.UsuarioDTO;
import wisepath.code.dto.UsuarioResponseDTO;
import wisepath.code.entity.Usuario;
import wisepath.code.service.UsuarioService;


@RestController
@RequestMapping("/users")
public class UsuarioController {
    private final UsuarioService usuarioService;  

    public UsuarioController(UsuarioService usuarioService){
        this.usuarioService = usuarioService;
    }
    

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> cadastrar (@RequestBody @Valid UsuarioDTO dto){
        Usuario usuario = new Usuario(); 
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(dto.senha());

        Usuario usuarioCadastrado = usuarioService.cadastrar(usuario);

        URI uri = URI.create("/users/" + usuarioCadastrado.getIdUsuario());
        // URI -> serve para representar e manipular endereços de recursos na web ou em APIs
        return ResponseEntity.created(uri).body(UsuarioResponseDTO.fromEntity(usuarioCadastrado));
        //Status 201 (usuário foi criado) e depois diz o endereço desse recurso
        //O Body entrega os dados do que foi criado
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDTO> autenticar(@RequestBody @Valid LoginDTO dto){
        Usuario usuario = usuarioService.autenticar(dto.email(), dto.senha());
        return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(usuario));
    }

     @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorID(@PathVariable Long id){
        Usuario usuario = usuarioService.buscarPorId(id);
        return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(usuario));
    }

     @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizarPerfil(@PathVariable Long id, @RequestBody UsuarioDTO dto){
        Usuario usuarioAtualizado = usuarioService.atualizarPerfil(id, dto.nome(), dto.email(), dto.senha());
        return ResponseEntity.ok(UsuarioResponseDTO.fromEntity(usuarioAtualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirConta(@PathVariable Long id) {
        usuarioService.excluirConta(id);
        return ResponseEntity.noContent().build();
    }

}
