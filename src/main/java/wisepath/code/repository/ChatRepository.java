package wisepath.code.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.model.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByUsuarioIdUsuarioOrderByDataCriacaoDesc(Long idUsuario);
}
