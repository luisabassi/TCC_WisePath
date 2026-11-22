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
import wisepath.code.dto.MensagemRespostaDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.service.FilaChatService;
import wisepath.code.service.ChatService;
import wisepath.code.service.GeminiService;
import wisepath.code.service.MensagemService;

@RestController
@RequestMapping("/chats/{idChat}/mensagens")
public class MensagemController {

    private final MensagemService mensagemService;
    private final ChatService chatService;
    private final GeminiService geminiService;
    private final FilaChatService filaChatService;

    public MensagemController(MensagemService mensagemService, ChatService chatService,
            GeminiService geminiService, FilaChatService filaChatService) {
        this.mensagemService = mensagemService;
        this.chatService = chatService;
        this.geminiService = geminiService;
        this.filaChatService = filaChatService;
    }

    @PostMapping
    public ResponseEntity<List<MensagemRespostaDTO>> enviarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @RequestBody @Valid NovaMensagemDTO dto) {

        Chat chat = chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        return filaChatService.executar(idChat, () -> {
            mensagemService.garantirHistoricoAtualizado(idChat, dto.ultimaMensagemId());

            // A IA responde antes de gravar: se ela falhar, o banco fica intacto
            List<Mensagem> historico = mensagemService.historicoComNovaMensagem(idChat, dto.conteudo());
            String textoResposta = geminiService.responderMensagem(historico);

            List<Mensagem> salvas = mensagemService.registrarConversa(chat, dto.conteudo(), textoResposta);
            Mensagem mensagemBot = salvas.get(1);

            URI uri = URI.create("/chats/" + idChat + "/mensagens/" + mensagemBot.getIdMensagem());
            return ResponseEntity.created(uri).body(salvas.stream().map(MensagemRespostaDTO::deEntidade).toList());
        });
    }

    @PutMapping("/{idMensagem}")
    public ResponseEntity<List<MensagemRespostaDTO>> editarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem,
            @RequestBody @Valid EditarMensagemDTO dto) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        return filaChatService.executar(idChat, () -> {
            mensagemService.buscarMensagemDoUsuario(idChat, idMensagem);

            // A IA responde antes de gravar: se ela falhar, o banco fica intacto
            List<Mensagem> historico = mensagemService.historicoComEdicao(idChat, idMensagem, dto.conteudo());
            String textoResposta = geminiService.responderMensagem(historico);

            List<Mensagem> salvas = mensagemService.editarMensagem(idChat, idMensagem, dto.conteudo(), textoResposta);
            return ResponseEntity.ok(salvas.stream().map(MensagemRespostaDTO::deEntidade).toList());
        });
    }

    @DeleteMapping("/{idMensagem}")
    public ResponseEntity<Void> deletarMensagem(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long idChat,
            @PathVariable Long idMensagem) {

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        filaChatService.executarSemRetorno(idChat, () -> mensagemService.deletarMensagem(idChat, idMensagem));
        return ResponseEntity.noContent().build();
    }

}