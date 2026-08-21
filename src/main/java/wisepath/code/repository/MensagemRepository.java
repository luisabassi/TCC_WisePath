package wisepath.code.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Mensagem;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByChatIdChatOrderByIdMensagemAsc(Long idChat);
    // apaga tudo que veio depois da mensagem editada (mesma conversa)
    void deleteByChatIdChatAndIdMensagemGreaterThan(Long idChat, Long idMensagem);
}
