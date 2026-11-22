package wisepath.code.dto;

import wisepath.code.entity.Profissao;

public record ProfissaoRespostaDTO(
    Long idProfissao,
    String nome,
    String descricao,
    String mediaSalarial,
    String empregabilidade,
    String tendenciasFuturas,
    String comoComecar,
    String cursosRelacionados
) {
    public static ProfissaoRespostaDTO deEntidade(Profissao profissao) {
        return new ProfissaoRespostaDTO(
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
