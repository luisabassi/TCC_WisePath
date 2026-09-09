package wisepath.code.dto;

import java.time.LocalDateTime;

import wisepath.code.entity.Chat;

public record ChatResponseDTO(
    Long idChat,
    String nome,
    LocalDateTime dataCriacao,
    Long idUsuario
) {
    public static ChatResponseDTO fromEntity(Chat chat) {
        return new ChatResponseDTO(
            chat.getIdChat(),
            chat.getNome(),
            chat.getDataCriacao(),
            chat.getUsuario() != null ? chat.getUsuario().getIdUsuario() : null
        );
    }
}
