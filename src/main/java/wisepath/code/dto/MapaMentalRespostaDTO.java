package wisepath.code.dto;

import wisepath.code.entity.MapaMental;

public record MapaMentalRespostaDTO(
    Long idMapaMental,
    String jsonMapa
){
   public static MapaMentalRespostaDTO deEntidade(MapaMental mapaMental) {
        return new MapaMentalRespostaDTO(
            mapaMental.getIdMapaMental(),
            mapaMental.getJsonMapa()
        );
    } 
}
