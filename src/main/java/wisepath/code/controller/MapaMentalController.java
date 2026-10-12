package wisepath.code.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.MapaMentalDTO;
import wisepath.code.dto.MapaMentalResponseDTO;
import wisepath.code.dto.MapaMentalResumoDTO;
import wisepath.code.entity.Usuario;
import wisepath.code.service.MapaMentalService;
import wisepath.code.service.ResultadoService;

@RestController
@RequestMapping("/mapamental")
public class MapaMentalController {
    private final MapaMentalService mapaMentalService;
    private final ResultadoService resultadoService;

    public MapaMentalController(MapaMentalService mapaMentalService, ResultadoService resultadoService) {
        this.mapaMentalService = mapaMentalService;
        this.resultadoService = resultadoService;
    }

    @GetMapping
    public ResponseEntity<List<MapaMentalResumoDTO>> listar(@AuthenticationPrincipal Usuario usuarioLogado) {
        List<MapaMentalResumoDTO> mapas = resultadoService.listarPorUsuario(usuarioLogado.getIdUsuario())
                .stream()
                .map(MapaMentalResumoDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(mapas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MapaMentalResponseDTO> buscarPorId(@AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long id) {
        resultadoService.buscarResultadoDoUsuarioPorMapaMental(id, usuarioLogado.getIdUsuario());
        return ResponseEntity.ok(MapaMentalResponseDTO.fromEntity(mapaMentalService.buscarPorId(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MapaMentalResponseDTO> atualizar(@AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long id, @RequestBody @Valid MapaMentalDTO dto) {
        resultadoService.buscarResultadoDoUsuarioPorMapaMental(id, usuarioLogado.getIdUsuario());
        return ResponseEntity.ok(MapaMentalResponseDTO.fromEntity(
                mapaMentalService.atualizarMapaMental(id, dto.jsonMapa())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMapaMental(@AuthenticationPrincipal Usuario usuarioLogado,
            @PathVariable Long id) {
        resultadoService.buscarResultadoDoUsuarioPorMapaMental(id, usuarioLogado.getIdUsuario());
        mapaMentalService.deletarMapaMental(id);
        return ResponseEntity.noContent().build();
    }
}