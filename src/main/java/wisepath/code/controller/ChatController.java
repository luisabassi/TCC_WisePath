package wisepath.code.controller;

import java.net.URI;
import java.util.List;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    public ResponseEntity<ChatResponseDTO> criarChat(
        @AuthenticationPrincipal Usuario usuarioLogado, 
        @RequestBody ChatDTO dto) {

        // Cria um novo chat associado ao usuário autenticado, usando o nome recebido no corpo da requisição.
        Chat chat = chatService.criarChat(usuarioLogado, dto.nome());

        // Define a localização do novo recurso no cabeçalho "Location" da resposta.
        URI uri = URI.create("/chats/" + chat.getIdChat());

        // Retorna o chat criado no formato de resposta, com o status HTTP 201 (Created).
        return ResponseEntity.created(uri).body(ChatResponseDTO.fromEntity(chat));
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<ChatResponseDTO> renomearChat(
        @AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long id, @RequestBody ChatDTO dto){
            chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());
            return ResponseEntity.ok(ChatResponseDTO.
                fromEntity(chatService.renomearChat(id, dto.nome())));
    }
    

    @GetMapping("/{id}")
    public ResponseEntity<ChatResponseDTO> buscarPorId(
        @AuthenticationPrincipal Usuario usuarioLogado, @PathVariable Long id) {
        Chat chat = chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());
        return ResponseEntity.ok(ChatResponseDTO.fromEntity(chat));
    }

    @GetMapping("/busca")
    public ResponseEntity<List<ChatResponseDTO>> buscarPorNome(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @RequestParam String nome) {
        List<ChatResponseDTO> chats = chatService.buscarChatsPorNome(usuarioLogado.getIdUsuario(), nome)
            .stream()
            .map(ChatResponseDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<ChatResponseDTO>> listarChatPorUsuario(@AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long id) {

        if (!id.equals(usuarioLogado.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
               "Você só pode listar os seus próprios chats.");
        }

        List<ChatResponseDTO> chats = chatService.listarChatsPorUsuario(id)
             .stream()
             .map(ChatResponseDTO::fromEntity)
             .toList();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{id}/mensagens")
    public ResponseEntity<List<MensagemResponseDTO>> listarMensagens(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id) {

        // Confirma que o chat existe e pertence ao usuário autenticado.
        chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());

        // Busca as mensagens do chat e converte as entidades para DTOs de resposta.
        List<MensagemResponseDTO> mensagens = chatService.listarMensagens(id)
                .stream()
                .map(MensagemResponseDTO::fromEntity)
                .toList();

        // Retorna a lista de mensagens com status HTTP 200 (OK).
        return ResponseEntity.ok(mensagens);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarChat(@AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long id) {
        chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());
        chatService.deletarChat(id);
        return ResponseEntity.noContent().build();
    }
}