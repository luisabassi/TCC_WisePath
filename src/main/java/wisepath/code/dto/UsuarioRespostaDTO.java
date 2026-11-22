package wisepath.code.dto;

import wisepath.code.entity.Usuario;

public record UsuarioRespostaDTO(
    Long idUsuario,
    String nome,
    String email
) {
    public static UsuarioRespostaDTO deEntidade(Usuario usuario) {
        return new UsuarioRespostaDTO(
            usuario.getIdUsuario(),
            usuario.getNome(),
            usuario.getEmail()
        );
    }
}