package wisepath.code.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Resultado;

public interface ResultadoRepository extends JpaRepository<Resultado, Long> {
    List<Resultado> findByChatIdChatOrderByIdResultadoDesc(Long IdChat);

    Optional<Resultado> findByMapaMentalIdMapaMental(Long idMapaMental);

    // Carrega chat, mapa e profissões na mesma consulta (evita N+1)
    @EntityGraph(attributePaths = {"chat", "mapaMental", "profissoes"})
    List<Resultado> findByChatUsuarioIdUsuarioOrderByIdResultadoDesc(Long idUsuario);
    
}
