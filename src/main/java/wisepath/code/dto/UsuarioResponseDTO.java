package wisepath.code.dto;

import wisepath.code.entity.Usuario;

public record UsuarioResponseDTO(
    Long idUsuario,
    String nome,
    String email
) {
    public static UsuarioResponseDTO fromEntity(Usuario usuario) {
        return new UsuarioResponseDTO(
            usuario.getIdUsuario(),
            usuario.getNome(),
            usuario.getEmail()
        );
    }
}