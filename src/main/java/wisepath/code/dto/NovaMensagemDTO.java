package wisepath.code.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import wisepath.code.entity.Mensagem.AutorMensagem;

public record NovaMensagemDTO(
    @NotBlank String conteudo,
    @NotNull AutorMensagem autor
){}
