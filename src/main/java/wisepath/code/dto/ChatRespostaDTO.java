package wisepath.code.dto;

import java.time.LocalDateTime;

import wisepath.code.entity.Chat;

public record ChatRespostaDTO(
    Long idChat,
    String nome,
    LocalDateTime dataCriacao,
    Long idUsuario
) {
    public static ChatRespostaDTO deEntidade(Chat chat) {
        return new ChatRespostaDTO(
            chat.getIdChat(),
            chat.getNome(),
            chat.getDataCriacao(),
            chat.getUsuario() != null ? chat.getUsuario().getIdUsuario() : null
        );
    }
}