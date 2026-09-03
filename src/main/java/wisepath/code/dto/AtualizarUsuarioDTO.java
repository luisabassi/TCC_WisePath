package wisepath.code.dto;

import jakarta.validation.constraints.Email;

public record AtualizarUsuarioDTO(
    String nome,
    @Email String email,
    String senha
) {}