package wisepath.code.controller;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import wisepath.code.dto.EditarMensagemDTO;
import wisepath.code.dto.MensagemResponseDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.entity.Usuario;
import wisepath.code.service.ChatService;
import wisepath.code.service.MensagemService;

@RestController
@RequestMapping("/chats/{idChat}/mensagens")
public class MensagemController {
    private final MensagemService mensagemService; 
    private final ChatService chatService;

    public MensagemController(MensagemService mensagemService, ChatService chatService){
        this.mensagemService = mensagemService;
        this.chatService = chatService; 
    }

    @PostMapping
    public ResponseEntity<MensagemResponseDTO> enviarMensagem(
        @AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long idChat, 
        @RequestBody @Valid NovaMensagemDTO dto){

        Chat chat = chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        Mensagem mensagem = mensagemService.enviarMensagem(chat, dto.conteudo(), Mensagem.AutorMensagem.USUARIO);
 
        URI uri = URI.create("/chats/" + idChat + "/mensagens/" + mensagem.getIdMensagem());
        return ResponseEntity.created(uri).body(MensagemResponseDTO.fromEntity(mensagem));
    }

    @PutMapping("/{idMensagem}")
    public ResponseEntity<MensagemResponseDTO> editarMensagem(
        @AuthenticationPrincipal Usuario usuarioLogado, 
        @PathVariable Long idChat, 
        @PathVariable Long idMensagem, 
        @RequestBody @Valid EditarMensagemDTO dto){

            chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario()); 
            garantirMensagemPertenceAoChat(idChat, idMensagem);
            return ResponseEntity.ok(MensagemResponseDTO.fromEntity(
                mensagemService.editarMensagem(idMensagem, dto.conteudo())
            ));
    }
    

    @DeleteMapping("/{idMensagem}")
    public ResponseEntity<Void> deletarMensagem(
        @AuthenticationPrincipal Usuario usuarioLogado,
        @PathVariable Long idChat, 
        @PathVariable Long idMensagem){

        chatService.buscarChatDoUsuario(idChat, usuarioLogado.getIdUsuario());
        garantirMensagemPertenceAoChat(idChat, idMensagem);
        mensagemService.deletarMensagem(idMensagem);
        return ResponseEntity.noContent().build();
    }

      private void garantirMensagemPertenceAoChat(
        Long idChat, Long idMensagem) {
            
        Mensagem mensagem = mensagemService.buscarPorId(idMensagem);
        if (!mensagem.getChat().getIdChat().equals(idChat)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada neste chat.");
        }
    }

}


