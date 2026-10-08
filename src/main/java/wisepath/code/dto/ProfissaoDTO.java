package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfissaoDTO(
    @NotBlank String nome, 
    @Size(min = 10, max = 400) String descricao,
    @NotBlank String mediaSalarial,
    @NotBlank String empregabilidade,
    @NotBlank String tendenciasFuturas,
    @NotBlank String comoComecar,
    @NotBlank String cursosRelacionados
) {}