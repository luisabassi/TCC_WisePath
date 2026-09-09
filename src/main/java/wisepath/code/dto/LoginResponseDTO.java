package wisepath.code.dto;

import wisepath.code.entity.Usuario;

public record LoginResponseDTO(
    Long idUsuario,
    String nome,
    String email,
    String token
) {
    public static LoginResponseDTO of(Usuario usuario, String token) {
        return new LoginResponseDTO(
            usuario.getIdUsuario(),
            usuario.getNome(),
            usuario.getEmail(),
            token
        );
    }
}