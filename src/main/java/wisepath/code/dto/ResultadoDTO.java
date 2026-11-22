package wisepath.code.dto;

import java.util.List;

import wisepath.code.entity.Resultado;

public record ResultadoDTO(
    Long idResultado,
    String resumo,
    Long idChat,
    MapaMentalRespostaDTO mapaMental,
    List<ProfissaoRespostaDTO> profissoes
) {
    public static ResultadoDTO deEntidade(Resultado resultado) {
        List<ProfissaoRespostaDTO> profissoes = resultado.getProfissoes()
                .stream()
                .map(ProfissaoRespostaDTO::deEntidade)
                .toList();

        return new ResultadoDTO(
            resultado.getIdResultado(),
            resultado.getResumo(),
            resultado.getChat() != null ? resultado.getChat().getIdChat() : null,
            MapaMentalRespostaDTO.deEntidade(resultado.getMapaMental()),
            profissoes
        );
    }
}