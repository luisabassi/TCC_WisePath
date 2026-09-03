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

import jakarta.validation.Valid;
import wisepath.code.dto.ProfissaoDTO;
import wisepath.code.entity.Profissao;
import wisepath.code.entity.Resultado;
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
    public ResponseEntity<List<Profissao>> listarTodos() {
        return ResponseEntity.ok(profissaoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profissao> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(profissaoService.buscarPorId(id));
    }

    @GetMapping("/busca")
    public ResponseEntity<List<Profissao>> buscarPorNome(
        @RequestParam String nome) {
        return ResponseEntity.ok(profissaoService.buscarPorNome(nome));
    }

    @GetMapping("/resultado/{id}")
    public ResponseEntity<List<Profissao>> 
    listarPorResultado(@PathVariable Long idResultado) {
        Resultado resultado = resultadoService.buscarPorId(idResultado);
        return ResponseEntity.ok(resultado.getProfissoes());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profissao> atualizar(@PathVariable Long id, 
        @RequestBody @Valid ProfissaoDTO dto) {
        return ResponseEntity.ok(profissaoService.atualizarProfissao(
                id, dto.descricao(), 
                dto.mediaSalarial(), 
                dto.empregabilidade()));
    }
}

