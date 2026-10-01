package wisepath.code.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import wisepath.code.entity.Chat;
import wisepath.code.entity.MapaMental;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Resultado;
import wisepath.code.entity.Usuario;
import wisepath.code.repository.ChatRepository;
import wisepath.code.repository.MapaMentalRepository;
import wisepath.code.repository.MensagemRepository;
import wisepath.code.repository.ResultadoRepository;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final MensagemRepository mensagemRepository;
    private final ResultadoRepository resultadoRepository;
    private final MapaMentalRepository mapaMentalRepository;

    public ChatService(ChatRepository chatRepository, MensagemRepository mensagemRepository,
            ResultadoRepository resultadoRepository, MapaMentalRepository mapaMentalRepository) {
        this.chatRepository = chatRepository;
        this.mensagemRepository = mensagemRepository;
        this.resultadoRepository = resultadoRepository;
        this.mapaMentalRepository = mapaMentalRepository;
    }

    @Transactional
    public Chat criarChat(Usuario usuario, String nome){
        Chat chat = new Chat();
        chat.setNome(nome);
        chat.setDataCriacao(LocalDateTime.now());
        chat.setUsuario(usuario);
        return chatRepository.save(chat);
    }

    @Transactional
    public Chat renomearChat(Long idChat, String novoNome) {
        Chat chat = chatRepository.findById(idChat)
            .orElseThrow(() -> new IllegalArgumentException("Chat não encontrado."));
        chat.setNome(novoNome);
        return chatRepository.save(chat);
    }

    @Transactional(readOnly = true)
    public Chat buscarPorId(Long idChat){
        return chatRepository.findById(idChat)
                .orElseThrow(() -> new IllegalArgumentException("Chat não encontrado."));
    }

    @Transactional(readOnly = true)
    public Chat buscarPorNome(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do chat inválido.");
        }

        return chatRepository.findFirstByNomeIgnoreCase(nome.trim())
                .orElseThrow(() -> new IllegalArgumentException("Chat não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<Chat> listarChatsPorUsuario(Long idUsuario){
        return chatRepository.findByUsuarioIdUsuarioOrderByDataCriacaoDesc(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<Mensagem> listarMensagens(Long idChat){
        return mensagemRepository.findByChatIdChatOrderByIdMensagemAsc(idChat);
    }

    @Transactional
    public void deletarChat(Long idChat) {
        Chat chat = chatRepository.findById(idChat)
            .orElseThrow(() -> new IllegalArgumentException("Chat não encontrado."));

        List<Resultado> resultados = resultadoRepository.findByChatIdChatOrderByIdResultadoDesc(idChat);
        List<MapaMental> mapas = resultados.stream()
            .map(Resultado::getMapaMental)
            .filter(Objects::nonNull)
            .toList();

        resultadoRepository.deleteAll(resultados);
        mapaMentalRepository.deleteAll(mapas);
        mensagemRepository.deleteAll(mensagemRepository.findByChatIdChatOrderByIdMensagemAsc(idChat));

        chatRepository.delete(chat);
    }

    public Chat validarPropriedade(Chat chat, Long idUsuarioLogado) {
        if (!chat.getUsuario().getIdUsuario().equals(idUsuarioLogado)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar este chat.");
        }
        return chat;
    }

    @Transactional(readOnly = true)
    public Chat buscarChatDoUsuario(Long idChat, Long idUsuarioLogado) {
        return validarPropriedade(buscarPorId(idChat), idUsuarioLogado);
    }
}