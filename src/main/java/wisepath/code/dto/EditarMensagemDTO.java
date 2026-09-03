package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;

public record EditarMensagemDTO(
    @NotBlank String conteudo
){}

