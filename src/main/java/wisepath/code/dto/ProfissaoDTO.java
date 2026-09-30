package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ProfissaoDTO(
    @NotBlank String nome, 
    @Size(min = 10, max = 400) String descricao,
    @NotNull @Positive Double mediaSalarial,
    @NotBlank String empregabilidade,
    @NotBlank String tendenciasFuturas
) {}