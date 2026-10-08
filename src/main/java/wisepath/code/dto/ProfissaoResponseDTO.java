package wisepath.code.dto;

import wisepath.code.entity.Profissao;

public record ProfissaoResponseDTO(
    Long idProfissao,
    String nome,
    String descricao,
    String mediaSalarial,
    String empregabilidade,
    String tendenciasFuturas,
    String comoComecar,
    String cursosRelacionados
) {
    public static ProfissaoResponseDTO fromEntity(Profissao profissao) {
        return new ProfissaoResponseDTO(
            profissao.getIdProfissao(),
            profissao.getNome(),
            profissao.getDescricao(),
            profissao.getMediaSalarial(),
            profissao.getEmpregabilidade(),
            profissao.getTendenciasFuturas(),
            profissao.getComoComecar(),
            profissao.getCursosRelacionados()
        );
    }
}
