package wisepath.code.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Mensagem;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByChatIdChatOrderByIdMensagemAsc(Long idChat);

    Optional<Mensagem> findFirstByChatIdChatOrderByIdMensagemDesc(Long idChat);

    // Edição: apaga só as posteriores e mantém a mensagem editada
    void deleteByChatIdChatAndIdMensagemGreaterThan(Long idChat, Long idMensagem);

    // Exclusão: apaga a mensagem escolhida e as posteriores
    void deleteByChatIdChatAndIdMensagemGreaterThanEqual(Long idChat, Long idMensagem);
}