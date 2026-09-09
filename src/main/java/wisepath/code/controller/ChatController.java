package wisepath.code.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import wisepath.code.dto.ChatDTO;
import wisepath.code.dto.ChatResponseDTO;
import wisepath.code.dto.MensagemResponseDTO;
import wisepath.code.entity.Chat;
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
    public ResponseEntity<ChatResponseDTO> criarChat(@AuthenticationPrincipal Usuario usuarioLogado, 
        @RequestBody ChatDTO dto) {
        Chat chat = chatService.criarChat(usuarioLogado, dto.nome());
        URI uri = URI.create("/chats/" + chat.getIdChat());
        return ResponseEntity.created(uri).body(ChatResponseDTO.fromEntity(chat));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ChatResponseDTO> renomearChat(@PathVariable Long id,
         @RequestBody ChatDTO dto) {
        return ResponseEntity.ok(ChatResponseDTO.fromEntity(chatService.renomearChat(id, dto.nome())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ChatResponseDTO.fromEntity(chatService.buscarPorId(id)));
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<ChatResponseDTO> buscarPorNome(@RequestParam String nome) {
      return ResponseEntity.ok(ChatResponseDTO.fromEntity(chatService.buscarPorNome(nome)));
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<ChatResponseDTO>> listarChatPorUsuario(@PathVariable Long id) {
        List<ChatResponseDTO> chats = chatService.listarChatsPorUsuario(id)
             .stream()
             .map(ChatResponseDTO::fromEntity)
             .toList();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{id}/mensagens")
    public ResponseEntity<List<MensagemResponseDTO>> listarMensagens(@PathVariable Long id) {
         List<MensagemResponseDTO> mensagens = chatService.listarMensagens(id)
             .stream()
             .map(MensagemResponseDTO::fromEntity)
             .toList();
        return ResponseEntity.ok(mensagens);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarChat(@PathVariable Long id) {
        chatService.deletarChat(id);
        return ResponseEntity.noContent().build();
    }
}
