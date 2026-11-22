package wisepath.code.dto;

import wisepath.code.entity.Usuario;

public record LoginRespostaDTO(
    Long idUsuario,
    String nome,
    String email,
    String token
) {
    public static LoginRespostaDTO criar(Usuario usuario, String token) {
        return new LoginRespostaDTO(
            usuario.getIdUsuario(),
            usuario.getNome(),
            usuario.getEmail(),
            token
        );
    }
}