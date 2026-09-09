package wisepath.code.dto;

import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Mensagem.AutorMensagem;

public record MensagemResponseDTO(
    Long idMensagem, 
    String conteudo,
    AutorMensagem autor,
    Long idChat
){
    public static MensagemResponseDTO fromEntity(Mensagem mensagem){
        return new MensagemResponseDTO(
            mensagem.getIdMensagem(), 
            mensagem.getConteudo(),
            mensagem.getAutor(),
            mensagem.getChat() != null ? mensagem.getChat().getIdChat() : null
        );
    }
}
    
