package wisepath.code.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}