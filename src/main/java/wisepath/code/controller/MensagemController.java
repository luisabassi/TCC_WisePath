package wisepath.code.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.EditarMensagemDTO;
import wisepath.code.dto.MensagemResponseDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ChatLockService;
import wisepath.code.service.ChatService;
import wisepath.code.service.GeminiService;
import wisepath.code.service.MensagemService;

@RestController
@RequestMapping("/chats/{idChat}/mensagens")
public class MensagemController {

    private final MensagemService mensagemService;
    private final ChatService chatService;
    private final GeminiService geminiService;
    private final ChatLockService chatLockService;

    public MensagemController(MensagemService mensagemService, ChatService chatService,
            GeminiService geminiService, ChatLockService chatLockService) {
        this.mensagemService = mensagemService;
        this.chatService = chatService;
        this.geminiService = geminiService;
        this.chatLockService = chatLockService;
    }

    @PostMapping
    public ResponseEntity<List<MensagemResponseDTO>> enviarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @RequestBody @Valid NovaMensagemDTO dto) {

        Chat chat = chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        return chatLockService.executar(idChat, () -> {
            mensagemService.garantirHistoricoAtualizado(idChat, dto.ultimaMensagemId());

            // A IA responde primeiro: se ela falhar, nada foi gravado no banco.
            List<Mensagem> historico = mensagemService.historicoComNovaMensagem(idChat, dto.conteudo());
            String textoResposta = geminiService.responderMensagem(historico);

            List<Mensagem> salvas = mensagemService.registrarConversa(chat, dto.conteudo(), textoResposta);
            Mensagem mensagemBot = salvas.get(1);

            URI uri = URI.create("/chats/" + idChat + "/mensagens/" + mensagemBot.getIdMensagem());
            return ResponseEntity.created(uri).body(salvas.stream().map(MensagemResponseDTO::fromEntity).toList());
        });
    }

    // Edita uma mensagem do usuário, apaga tudo que veio depois dela e devolve
    @PutMapping("/{idMensagem}")
    public ResponseEntity<List<MensagemResponseDTO>> editarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem,
            @RequestBody @Valid EditarMensagemDTO dto) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        return chatLockService.executar(idChat, () -> {
            mensagemService.buscarMensagemDoUsuario(idChat, idMensagem);

            // A IA responde primeiro: se ela falhar, nada foi alterado no banco.
            List<Mensagem> historico = mensagemService.historicoComEdicao(idChat, idMensagem, dto.conteudo());
            String textoResposta = geminiService.responderMensagem(historico);

            List<Mensagem> salvas = mensagemService.editarMensagem(idChat, idMensagem, dto.conteudo(), textoResposta);
            return ResponseEntity.ok(salvas.stream().map(MensagemResponseDTO::fromEntity).toList());
        });
    }

    // Exclui a mensagem selecionada e todas as posteriores.
    @DeleteMapping("/{idMensagem}")
    public ResponseEntity<Void> deletarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        chatLockService.executarSemRetorno(idChat, () -> mensagemService.deletarMensagem(idChat, idMensagem));
        return ResponseEntity.noContent().build();
    }

}