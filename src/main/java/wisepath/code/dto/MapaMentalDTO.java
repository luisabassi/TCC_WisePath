package wisepath.code.dto;

import jakarta.validation.constraints.NotNull;

public record MapaMentalDTO(
    @NotNull String jsonMapa
){}
