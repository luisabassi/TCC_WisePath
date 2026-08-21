package wisepath.code.dto;

import jakarta.validation.constraints.*;

public record UsuarioDTO(
    @NotBlank String nome, 
    @NotBlank @Email String email,
    @Size(min = 8, max = 20) String senha
){}