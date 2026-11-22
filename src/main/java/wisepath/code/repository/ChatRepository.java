package wisepath.code.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByUsuarioIdUsuarioOrderByDataCriacaoDesc(Long idUsuario);

    Optional<Chat> findFirstByNomeIgnoreCase(String nome);

    List<Chat> findByUsuarioIdUsuarioAndNomeContainingIgnoreCaseOrderByDataCriacaoDesc(Long idUsuario, String nome);
    
}
