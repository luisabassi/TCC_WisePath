package wisepath.code.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import wisepath.code.dto.AnaliseIADTO;
import wisepath.code.dto.ResultadoDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Resultado;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ChatService;
import wisepath.code.service.GeminiService;
import wisepath.code.service.ResultadoService;


@RestController
@RequestMapping("/chats/{idChat}/resultado")
public class ResultadoController {
    private final ChatService chatService;
    private final GeminiService geminiService;
    private final ResultadoService resultadoService;

    public ResultadoController(ChatService chatService, 
        GeminiService geminiService, 
        ResultadoService resultadoService) {

        this.chatService = chatService;
        this.geminiService = geminiService;
        this.resultadoService = resultadoService;
    }

    @PostMapping 
    public ResponseEntity<ResultadoDTO> gerarResultado(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idChat){
        Chat chat = chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());

        AnaliseIADTO analise = geminiService.analisarChat(chat);

        Resultado resultado = resultadoService.gerarResultado(
                chat,
                analise.resumo(),
                analise.jsonMapaMental(),
                analise.profissoes()
        );
 
        return ResponseEntity.ok(ResultadoDTO.fromEntity(resultado));
    }

    @GetMapping("/{idResultado}")
    public ResponseEntity<ResultadoDTO> buscarPorId(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idChat, @PathVariable Long idResultado) {

        Resultado resultado = resultadoService.buscarResultadoDoUsuario(idResultado, usuarioLogado.getIdUsuario());
        garantirResultadoPertenceAoChat(resultado, idChat);

        return ResponseEntity.ok(ResultadoDTO.fromEntity(resultado));
    }

    @GetMapping
    public ResponseEntity<List<ResultadoDTO>> listarPorChat(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idChat) {
        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
 
        List<ResultadoDTO> resultados = resultadoService.listarPorChat(idChat)
                .stream()
                .map(ResultadoDTO::fromEntity)
                .toList();
 
        return ResponseEntity.ok(resultados);
    }

    @DeleteMapping("/{idResultado}")
    public ResponseEntity<Void> deletar(@AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idChat, @PathVariable Long idResultado) {

        Resultado resultado = resultadoService.buscarResultadoDoUsuario(idResultado, usuarioLogado.getIdUsuario());
        garantirResultadoPertenceAoChat(resultado, idChat);
        resultadoService.deletar(idResultado);

        return ResponseEntity.noContent().build();
    }

    private void garantirResultadoPertenceAoChat(Resultado resultado, Long idChat) {
        if (!resultado.getChat().getIdChat().equals(idChat)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resultado não encontrado neste chat.");
        }
    }
}
