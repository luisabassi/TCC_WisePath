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
import wisepath.code.dto.ChatRespostaDTO;
import wisepath.code.dto.MensagemRespostaDTO;
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
    public ResponseEntity<ChatRespostaDTO> criarChat(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @RequestBody ChatDTO dto) {

        Chat chat = chatService.criarChat(usuarioLogado, dto.nome());
        URI uri = URI.create("/chats/" + chat.getIdChat());

        return ResponseEntity.created(uri).body(ChatRespostaDTO.deEntidade(chat));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChatRespostaDTO> renomearChat(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id, @RequestBody ChatDTO dto) {
        chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());
        return ResponseEntity.ok(ChatRespostaDTO.deEntidade(chatService.renomearChat(id, dto.nome())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatRespostaDTO> buscarPorId(
        @AuthenticationPrincipal Usuario usuarioLogado, @PathVariable Long id) {
        Chat chat = chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());
        return ResponseEntity.ok(ChatRespostaDTO.deEntidade(chat));
    }

    @GetMapping("/busca")
    public ResponseEntity<List<ChatRespostaDTO>> buscarPorNome(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @RequestParam String nome) {
        List<ChatRespostaDTO> chats = chatService.buscarChatsPorNome(usuarioLogado.getIdUsuario(), nome)
            .stream()
            .map(ChatRespostaDTO::deEntidade)
            .toList();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/usuario/{id}")
    public ResponseEntity<List<ChatRespostaDTO>> listarChatPorUsuario(@AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long id) {

        if (!id.equals(usuarioLogado.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
               "Você só pode listar os seus próprios chats.");
        }

        List<ChatRespostaDTO> chats = chatService.listarChatsPorUsuario(id)
             .stream()
             .map(ChatRespostaDTO::deEntidade)
             .toList();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{id}/mensagens")
    public ResponseEntity<List<MensagemRespostaDTO>> listarMensagens(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long id) {

        chatService.buscarChatDoUsuario(id, usuarioLogado.getIdUsuario());

        List<MensagemRespostaDTO> mensagens = chatService.listarMensagens(id)
                .stream()
                .map(MensagemRespostaDTO::deEntidade)
                .toList();

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