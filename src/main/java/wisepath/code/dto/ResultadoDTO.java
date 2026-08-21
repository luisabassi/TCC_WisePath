package wisepath.code.dto;

import java.util.ArrayList;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import wisepath.code.entity.Chat;
import wisepath.code.entity.MapaMental;
import wisepath.code.entity.Profissao;

public record ResultadoDTO(
    @NotBlank String resumo, 
    @NotNull Chat chat,
    @NotNull MapaMental mapaMental,
    @NotNull ArrayList<Profissao> profissoes
) {}
