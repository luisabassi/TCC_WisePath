package wisepath.code.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.MapaMentalDTO;
import wisepath.code.entity.MapaMental;
import wisepath.code.service.MapaMentalService;
import wisepath.code.dto.MapaMentalResponseDTO;


@RestController
@RequestMapping("/mapamental")
public class MapaMentalController{
    private final MapaMentalService mapaMentalService;

    public MapaMentalController(MapaMentalService mapaMentalService){
        this.mapaMentalService = mapaMentalService;
    }  
    
    @GetMapping("/{id}")
    public ResponseEntity<MapaMentalResponseDTO> buscarPorId(@PathVariable Long id){
        return ResponseEntity.ok(MapaMentalResponseDTO.
            fromEntity(mapaMentalService.buscarPorId(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MapaMentalResponseDTO> atualizar(@PathVariable Long id, 
        @RequestBody @Valid MapaMentalDTO dto){
            return ResponseEntity.ok(MapaMentalResponseDTO.
                fromEntity(mapaMentalService.atualizarMapaMental(id, dto.jsonMapa())));

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarMapaMental(@PathVariable Long id){
        mapaMentalService.deletarMapaMental(id);
        return ResponseEntity.noContent().build();
    }
}