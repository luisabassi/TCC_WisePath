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

    // Validação de autor: só mensagens do USUARIO (e que pertençam ao chat informado)
    // podem ser editadas ou excluídas. As do chatbot nunca.
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

    // Histórico "como ficaria" com a nova mensagem do usuário no fim
    @Transactional(readOnly = true)
    public List<Mensagem> historicoComNovaMensagem(Long idChat, String conteudo){
        List<Mensagem> historico = new ArrayList<>(mensagemRepository.findByChatIdChatOrderByIdMensagemAsc(idChat));

        Mensagem nova = new Mensagem();
        nova.setAutor(Mensagem.AutorMensagem.USUARIO);
        nova.setConteudo(conteudo);
        historico.add(nova);
        return historico;
    }

    @Transactional
    public List<Mensagem> registrarConversa(Chat chat, String conteudoUsuario, String respostaChatbot){
        Mensagem doUsuario = enviarMensagem(chat, conteudoUsuario, Mensagem.AutorMensagem.USUARIO);
        Mensagem doChatbot = enviarMensagem(chat, respostaChatbot, Mensagem.AutorMensagem.CHATBOT);
        return List.of(doUsuario, doChatbot);
    }

    // Id da última mensagem do chat (0 se estiver vazio)
    @Transactional(readOnly = true)
    public long idDaUltimaMensagem(Long idChat){
        return mensagemRepository.findFirstByChatIdChatOrderByIdMensagemDesc(idChat)
                .map(Mensagem::getIdMensagem)
                .orElse(0L);
    }

    // Detecta tela desatualizada 
    @Transactional(readOnly = true)
    public void garantirHistoricoAtualizado(Long idChat, Long ultimaMensagemConhecida){
        if (ultimaMensagemConhecida == null) return; // cliente não informou: sem verificação

        if (idDaUltimaMensagem(idChat) != ultimaMensagemConhecida.longValue()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta conversa foi atualizada em outra janela. Carreguei o histórico mais recente; envie sua mensagem novamente.");
        }
    }

    // Histórico "como ficaria" após a edição
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

    // Edição: atualiza a mensagem, remove as posteriores 
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

    // Exclusão: remove a mensagem selecionada e TODAS as posteriores do chat.
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