package wisepath.code.dto;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem.AutorMensagem;

public record MensagemDTO(
    @NotNull String conteudo,
    @NotNull @Enumerated(EnumType.STRING) AutorMensagem autor, 
    @NotNull Chat chat
){}
