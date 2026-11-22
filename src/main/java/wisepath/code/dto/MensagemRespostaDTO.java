package wisepath.code.dto;

import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Mensagem.AutorMensagem;

public record MensagemRespostaDTO(
    Long idMensagem, 
    String conteudo,
    AutorMensagem autor,
    Long idChat
){
    public static MensagemRespostaDTO deEntidade(Mensagem mensagem){
        return new MensagemRespostaDTO(
            mensagem.getIdMensagem(), 
            mensagem.getConteudo(),
            mensagem.getAutor(),
            mensagem.getChat() != null ? mensagem.getChat().getIdChat() : null
        );
    }
}
    
