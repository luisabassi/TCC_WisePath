package wisepath.code.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wisepath.code.dto.AnaliseIADTO;
import wisepath.code.dto.ResultadoDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Resultado;
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
    public ResponseEntity<ResultadoDTO> gerarResultado(@PathVariable Long idChat){
        Chat chat = chatService.buscarPorId(idChat);

        AnaliseIADTO analise = geminiService.analisarChat(chat);

         Resultado resultado = resultadoService.gerarResultado(
                chat,
                analise.resumo(),
                analise.jsonMapaMental(),
                analise.profissoes()
        );
 
        return ResponseEntity.ok(ResultadoDTO.fromEntity(resultado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultadoDTO> buscarPorId(@PathVariable Long idChat, @PathVariable Long idResultado){
        Resultado resultado = resultadoService.buscarPorId(idResultado);
        return ResponseEntity.ok(ResultadoDTO.fromEntity(resultado));
    }

    @GetMapping
    public ResponseEntity<List<ResultadoDTO>> listarPorChat(@PathVariable Long idChat) {
        List<ResultadoDTO> resultados = resultadoService.listarPorChat(idChat)
                .stream()
                .map(ResultadoDTO::fromEntity)
                .toList();
 
        return ResponseEntity.ok(resultados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarResultado(@PathVariable Long id){
        resultadoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
    
}
