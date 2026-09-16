package wisepath.code.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.repository.ChatRepository;
import wisepath.code.repository.MensagemRepository;

@Service
public class ChatService {

    @Autowired private ChatRepository chatRepository;
    @Autowired private MensagemRepository mensagemRepository;


    public ChatRepository getChatRepository() {
        return chatRepository;
    }

    public void setChatRepository(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public MensagemRepository getMensagemRepository() {
        return mensagemRepository;
    }

    public void setMensagemRepository(MensagemRepository mensagemRepository) {
        this.mensagemRepository = mensagemRepository;
    }

    public ChatService(ChatRepository chatRepository, MensagemRepository mensagemRepository) {
        this.chatRepository = chatRepository;
        this.mensagemRepository = mensagemRepository;
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
    public void deletarChat(Long idChat){
        if (!chatRepository.existsById(idChat)) {
            throw new IllegalArgumentException("Chat não encontrado.");
        }
        
        chatRepository.deleteById(idChat);
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