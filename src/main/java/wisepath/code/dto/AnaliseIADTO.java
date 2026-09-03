package wisepath.code.dto;

import java.util.List;

public record AnaliseIADTO(
    String resumo,
    String jsonMapaMental,
    List<ProfissaoDTO> profissoes
){}
