package wisepath.code.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.repository.MensagemRepository;

@Service
public class MensagemService{
    @Autowired private MensagemRepository mensagemRepository;

    public MensagemService(MensagemRepository mensagemRepository) {
        this.mensagemRepository = mensagemRepository;
    }

    @Transactional
    public Mensagem enviarMensagem(Chat chat, String conteudo, Mensagem.AutorMensagem autor){
        Mensagem mensagem = new Mensagem();
        mensagem.setConteudo(conteudo);
        mensagem.setAutor(autor);
        mensagem.setChat(chat);
        return mensagemRepository.save(mensagem);
    }

    @Transactional
    public Mensagem editarMensagem(Long idMensagem, String novoConteudo){
        if (novoConteudo == null || novoConteudo.isBlank()) {
            throw new IllegalArgumentException("O conteúdo da mensagem não pode ser vazio.");
        }

        Mensagem mensagem = mensagemRepository.findById(idMensagem).orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));

        if(mensagem.getAutor() != Mensagem.AutorMensagem.USUARIO){
            throw new IllegalStateException("Só é possível editar mensagens do usuário.");
        }

        mensagemRepository.deleteByChatIdChatAndIdMensagemGreaterThan(mensagem.getChat().getIdChat(), idMensagem);

        mensagem.setConteudo(novoConteudo);
        return mensagemRepository.save(mensagem);
    }

    @Transactional
    public void deletarMensagem(Long idMensagem){
        if (!mensagemRepository.existsById(idMensagem)) {
            throw new IllegalArgumentException("Mensagem não encontrada.");
        }
        mensagemRepository.deleteById(idMensagem);
    }

    public MensagemRepository getMensagemRepository() {
        return mensagemRepository;
    }
    
    public void setMensagemRepository(MensagemRepository mensagemRepository) {
        this.mensagemRepository = mensagemRepository;
    }

}