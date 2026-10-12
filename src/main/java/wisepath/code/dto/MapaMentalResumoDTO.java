package wisepath.code.dto;

import java.time.LocalDateTime;
import java.util.List;

import wisepath.code.entity.Resultado;

// Tudo o que a galeria / tela de mapas precisa em uma única chamada:
// o JSON do mapa, de qual conversa ele veio e as profissões sugeridas
public record MapaMentalResumoDTO(
    Long idMapaMental,
    Long idResultado,
    Long idChat,
    String nomeChat,
    LocalDateTime dataCriacao,
    String resumo,
    String jsonMapa,
    List<ProfissaoResponseDTO> profissoes
) {
    public static MapaMentalResumoDTO fromEntity(Resultado resultado) {
        List<ProfissaoResponseDTO> profissoes = resultado.getProfissoes() == null
                ? List.of()
                : resultado.getProfissoes().stream().map(ProfissaoResponseDTO::fromEntity).toList();

        return new MapaMentalResumoDTO(
            resultado.getMapaMental().getIdMapaMental(),
            resultado.getIdResultado(),
            resultado.getChat().getIdChat(),
            resultado.getChat().getNome(),
            resultado.getChat().getDataCriacao(),
            resultado.getResumo(),
            resultado.getMapaMental().getJsonMapa(),
            profissoes
        );
    }
}