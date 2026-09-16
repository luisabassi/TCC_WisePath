package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatDTO(
    @NotBlank String nome
) {}
