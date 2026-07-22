package wisepath.code.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.model.Mensagem;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByChatIdChatOrderByIdMensagemAsc(Long idChat);
}
