package wisepath.code.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Mensagem;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByChatIdChatOrderByIdMensagemAsc(Long idChat);

    //Edição
    void deleteByChatIdChatAndIdMensagemGreaterThan(Long idChat, Long idMensagem);

    //Exclusão
    void deleteByChatIdChatAndIdMensagemGreaterThanEqual(Long idChat, Long idMensagem);

}
