package wisepath.code.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Resultado;

public interface ResultadoRepository extends JpaRepository<Resultado, Long> {
    List<Resultado> findByChatIdChatOrderByIdResultadoDesc(Long IdChat);
}
