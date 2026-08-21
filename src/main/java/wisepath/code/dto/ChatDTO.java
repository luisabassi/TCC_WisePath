package wisepath.code.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import wisepath.code.entity.Resultado;
import wisepath.code.entity.Usuario;

public record ChatDTO(
    @NotNull String nome,
    @NotNull @DateTimeFormat(pattern = "dd/MM/yyyy") LocalDateTime dataCriacao,
    @NotNull @Size(min = 1) ArrayList<Resultado> resultados,
    @NotNull Usuario usuario
){}