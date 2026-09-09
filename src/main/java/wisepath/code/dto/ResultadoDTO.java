package wisepath.code.dto;

import java.util.List;

import wisepath.code.entity.Resultado;

public record ResultadoDTO(
    Long idResultado,
    String resumo,
    Long idChat,
    MapaMentalResponseDTO mapaMental,
    List<ProfissaoResponseDTO> profissoes
) {
    public static ResultadoDTO fromEntity(Resultado resultado) {
        List<ProfissaoResponseDTO> profissoes = resultado.getProfissoes()
                .stream()
                .map(ProfissaoResponseDTO::fromEntity)
                .toList();

        return new ResultadoDTO(
            resultado.getIdResultado(),
            resultado.getResumo(),
            resultado.getChat() != null ? resultado.getChat().getIdChat() : null,
            MapaMentalResponseDTO.fromEntity(resultado.getMapaMental()),
            profissoes
        );
    }
}