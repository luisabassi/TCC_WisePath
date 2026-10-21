package wisepath.code.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import wisepath.code.dto.EditarMensagemDTO;
import wisepath.code.dto.MensagemResponseDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ChatService;
import wisepath.code.service.GeminiService;
import wisepath.code.service.MensagemService;

@RestController
@RequestMapping("/chats/{idChat}/mensagens")
public class MensagemController {

    private final MensagemService mensagemService;
    private final ChatService chatService;
    private final GeminiService geminiService;

    public MensagemController(MensagemService mensagemService, ChatService chatService, GeminiService geminiService) {
        this.mensagemService = mensagemService;
        this.chatService = chatService;
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<List<MensagemResponseDTO>> enviarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @RequestBody @Valid NovaMensagemDTO dto) {

        Chat chat = chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        Mensagem mensagemUsuario = mensagemService.enviarMensagem(chat, dto.conteudo(), Mensagem.AutorMensagem.USUARIO);

        String textoResposta = geminiService.responderMensagem(chat);

        Mensagem mensagemBot = mensagemService.enviarMensagem(chat, textoResposta, Mensagem.AutorMensagem.CHATBOT);

        URI uri = URI.create("/chats/" + idChat + "/mensagens/" + mensagemBot.getIdMensagem());
        return ResponseEntity.created(uri).body(List.of(
            MensagemResponseDTO.fromEntity(mensagemUsuario),
            MensagemResponseDTO.fromEntity(mensagemBot)
        ));
    }

    @PutMapping("/{idMensagem}")
    public ResponseEntity<MensagemResponseDTO> editarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem,
            @RequestBody @Valid EditarMensagemDTO dto) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        garantirMensagemPertenceAoChat(idChat, idMensagem);
        return ResponseEntity.ok(MensagemResponseDTO.fromEntity(
                mensagemService.editarMensagem(idMensagem, dto.conteudo())
        ));
    }

    @DeleteMapping("/{idMensagem}")
    public ResponseEntity<Void> deletarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        garantirMensagemPertenceAoChat(idChat, idMensagem);
        mensagemService.deletarMensagem(idMensagem);
        return ResponseEntity.noContent().build();
    }

    private void garantirMensagemPertenceAoChat(
      Long idChat, Long idMensagem) {

      Mensagem mensagem = mensagemService.buscarPorId(idMensagem);
      if (!mensagem.getChat().getIdChat().equals(idChat)) {
         throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada neste chat.");
      }
    }

}