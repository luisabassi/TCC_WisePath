package wisepath.code.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.ProfissaoDTO;
import wisepath.code.dto.ProfissaoRespostaDTO;
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
    public ResponseEntity<List<ProfissaoRespostaDTO>> listarTodos() {
        List<ProfissaoRespostaDTO> profissoes = profissaoService.listarTodos()
                .stream()
                .map(ProfissaoRespostaDTO::deEntidade)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfissaoRespostaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ProfissaoRespostaDTO.deEntidade(
            profissaoService.buscarPorId(id)));
    }

    @GetMapping("/busca")
    public ResponseEntity<List<ProfissaoRespostaDTO>> buscarPorNome(@RequestParam String nome) {
        List<ProfissaoRespostaDTO> profissoes = profissaoService.buscarPorNome(nome)
                .stream()
                .map(ProfissaoRespostaDTO::deEntidade)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @GetMapping("/resultado/{idResultado}")
    public ResponseEntity<List<ProfissaoRespostaDTO>> listarPorResultado(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idResultado) {
        Resultado resultado = resultadoService.buscarResultadoDoUsuario(idResultado, usuarioLogado.getIdUsuario());
        List<ProfissaoRespostaDTO> profissoes = resultado.getProfissoes()
                .stream()
                .map(ProfissaoRespostaDTO::deEntidade)
                .toList();
        return ResponseEntity.ok(profissoes);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfissaoRespostaDTO> atualizar(@PathVariable Long id,
        @RequestBody @Valid ProfissaoDTO dto) {
        return ResponseEntity.ok(ProfissaoRespostaDTO.deEntidade(
            profissaoService.atualizarProfissao(
                id, dto.descricao(),
                dto.mediaSalarial(),
                dto.empregabilidade(), 
                dto.tendenciasFuturas(),
                dto.comoComecar(),
                dto.cursosRelacionados()
            )));
    }
}