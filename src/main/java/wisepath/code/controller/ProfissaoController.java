package wisepath.code.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import jakarta.validation.Valid;
import wisepath.code.dto.ProfissaoDTO;
import wisepath.code.dto.ProfissaoResponseDTO;
import wisepath.code.entity.Resultado;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ProfissaoService;
import wisepath.code.service.ResultadoService;

@RestController
@RequestMapping("/profissoes")
public class ProfissaoController {
    private final ProfissaoService profissaoService;
    private final ResultadoService resultadoService;

    public ProfissaoController(ProfissaoService profissaoService, ResultadoService resultadoService) {
        this.profissaoService = profissaoService;
        this.resultadoService = resultadoService;
    }

    @GetMapping
    public ResponseEntity<List<ProfissaoResponseDTO>> listarTodos() {
        List<ProfissaoResponseDTO> profissoes = profissaoService.listarTodos()
                .stream()
                .map(ProfissaoResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfissaoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ProfissaoResponseDTO.fromEntity(
            profissaoService.buscarPorId(id)));
    }

    @GetMapping("/busca")
    public ResponseEntity<List<ProfissaoResponseDTO>> buscarPorNome(@RequestParam String nome) {
        List<ProfissaoResponseDTO> profissoes = profissaoService.buscarPorNome(nome)
                .stream()
                .map(ProfissaoResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @GetMapping("/resultado/{idResultado}")
    public ResponseEntity<List<ProfissaoResponseDTO>> listarPorResultado(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idResultado) {
        Resultado resultado = resultadoService.buscarResultadoDoUsuario(idResultado, usuarioLogado.getIdUsuario());
        List<ProfissaoResponseDTO> profissoes = resultado.getProfissoes()
                .stream()
                .map(ProfissaoResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfissaoResponseDTO> atualizar(@PathVariable Long id,
        @RequestBody @Valid ProfissaoDTO dto) {
        return ResponseEntity.ok(ProfissaoResponseDTO.fromEntity(
            profissaoService.atualizarProfissao(
                id, dto.descricao(),
                dto.mediaSalarial(),
                dto.empregabilidade())));
    }
}