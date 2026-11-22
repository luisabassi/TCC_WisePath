package wisepath.code.dto;

import java.time.LocalDateTime;
import java.util.List;

import wisepath.code.entity.Resultado;

// Tudo o que a galeria de mapas precisa em uma única chamada
public record MapaMentalResumoDTO(
    Long idMapaMental,
    Long idResultado,
    Long idChat,
    String nomeChat,
    LocalDateTime dataCriacao,
    String resumo,
    String jsonMapa,
    List<ProfissaoRespostaDTO> profissoes
) {
    public static MapaMentalResumoDTO deEntidade(Resultado resultado) {
        List<ProfissaoRespostaDTO> profissoes = resultado.getProfissoes() == null
                ? List.of()
                : resultado.getProfissoes().stream().map(ProfissaoRespostaDTO::deEntidade).toList();

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