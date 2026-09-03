package wisepath.code.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import wisepath.code.dto.ChatDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ChatService;

@RestController
@RequestMapping("/chats")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<Chat> criarChat(@AuthenticationPrincipal Usuario usuarioLogado, @RequestBody ChatDTO dto) {
        Chat chat = chatService.criarChat(usuarioLogado, dto.nome());
        URI uri = URI.create("/chats/" + chat.getIdChat());
        return ResponseEntity.created(uri).body(chat);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Chat> renomearChat(@PathVariable Long id, @RequestBody ChatDTO dto) {
        return ResponseEntity.ok(chatService.renomearChat(id, dto.nome()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chat> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.buscarPorId(id));
    }

    @GetMapping("/nome")
    public ResponseEntity<Chat> buscarPorNome(@RequestBody ChatDTO dto) {
        return ResponseEntity.ok(chatService.buscarPorNome(dto.nome()));
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<Chat>> listarChatPorUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.listarChatsPorUsuario(id));
    }

    @GetMapping("/{id}/mensagens")
    public ResponseEntity<List<Mensagem>> listarMensagens(@PathVariable Long id) {
        return ResponseEntity.ok(chatService.listarMensagens(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarChat(@PathVariable Long id) {
        chatService.deletarChat(id);
        return ResponseEntity.noContent().build();
    }

    //ir dps para o usuarioController e usuarioService p/ colocar os métodos de excluir conta pq eu esqueci (poronguice que fala?)
}
