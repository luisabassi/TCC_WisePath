package wisepath.code.dto;

import wisepath.code.entity.MapaMental;

public record MapaMentalResponseDTO(
    Long idMapaMental,
    String jsonMapa
){
   public static MapaMentalResponseDTO fromEntity(MapaMental mapaMental) {
        return new MapaMentalResponseDTO(
            mapaMental.getIdMapaMental(),
            mapaMental.getJsonMapa()
        );
    } 
}
