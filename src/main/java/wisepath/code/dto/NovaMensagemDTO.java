package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;

public record NovaMensagemDTO(
    @NotBlank String conteudo,  
    Long ultimaMensagemId
){}
