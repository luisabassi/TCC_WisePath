package wisepath.code.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.repository.MensagemRepository;
import wisepath.code.repository.ResultadoRepository;

@Service
public class MensagemService{
    private final MensagemRepository mensagemRepository;
    private final ResultadoRepository resultadoRepository;

    public MensagemService(MensagemRepository mensagemRepository, ResultadoRepository resultadoRepository) {
        this.mensagemRepository = mensagemRepository;
        this.resultadoRepository = resultadoRepository;
    }

    @Transactional
    public Mensagem enviarMensagem(Chat chat, String conteudo, Mensagem.AutorMensagem autor){
        Mensagem mensagem = new Mensagem();
        mensagem.setConteudo(conteudo);
        mensagem.setAutor(autor);
        chat.adicionarMensagem(mensagem);
        return mensagemRepository.save(mensagem);
    }

    @Transactional(readOnly = true)
    public Mensagem buscarPorId(Long idMensagem){
        return mensagemRepository.findById(idMensagem)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada."));
    }

    // Validação de autor
    @Transactional(readOnly = true)
    public Mensagem buscarMensagemDoUsuario(Long idChat, Long idMensagem){
        Mensagem mensagem = buscarPorId(idMensagem);

        if (!mensagem.getChat().getIdChat().equals(idChat)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada neste chat.");
        }
        if (mensagem.getAutor() != Mensagem.AutorMensagem.USUARIO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Só é possível editar ou excluir mensagens enviadas por você.");
        }
        return mensagem;
    }

    @Transactional(readOnly = true)
    public List<Mensagem> historicoComEdicao(Long idChat, Long idMensagem, String novoConteudo){
        List<Mensagem> historico = new ArrayList<>();
        for (Mensagem m : mensagemRepository.findByChatIdChatOrderByIdMensagemAsc(idChat)) {
            if (m.getIdMensagem() > idMensagem) break;

            if (m.getIdMensagem().equals(idMensagem)) {
                Mensagem editada = new Mensagem();
                editada.setIdMensagem(m.getIdMensagem());
                editada.setAutor(m.getAutor());
                editada.setConteudo(novoConteudo);
                historico.add(editada);
            } else {
                historico.add(m);
            }
        }
        return historico;
    }

    @Transactional
    public List<Mensagem> editarMensagem(Long idChat, Long idMensagem, String novoConteudo, String respostaChatbot){
        if (novoConteudo == null || novoConteudo.isBlank()) {
            throw new IllegalArgumentException("O conteúdo da mensagem não pode ser vazio.");
        }

        Mensagem mensagem = buscarMensagemDoUsuario(idChat, idMensagem);

        mensagemRepository.deleteByChatIdChatAndIdMensagemGreaterThan(idChat, idMensagem);
        removerResultados(idChat);

        mensagem.setConteudo(novoConteudo);
        Mensagem atualizada = mensagemRepository.save(mensagem);

        Mensagem resposta = new Mensagem();
        resposta.setConteudo(respostaChatbot);
        resposta.setAutor(Mensagem.AutorMensagem.CHATBOT);
        resposta.setChat(mensagem.getChat());
        resposta = mensagemRepository.save(resposta);

        return List.of(atualizada, resposta);
    }

    @Transactional
    public void deletarMensagem(Long idChat, Long idMensagem){
        buscarMensagemDoUsuario(idChat, idMensagem);

        mensagemRepository.deleteByChatIdChatAndIdMensagemGreaterThanEqual(idChat, idMensagem);
        removerResultados(idChat);
    }
    
    private void removerResultados(Long idChat){
        resultadoRepository.deleteAll(resultadoRepository.findByChatIdChatOrderByIdResultadoDesc(idChat));
    }
}