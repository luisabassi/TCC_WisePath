package wisepath.code.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.EditarMensagemDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.dto.MensagemResponseDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
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
    public ResponseEntity<MensagemResponseDTO> enviarMensagem(@PathVariable Long idChat, 
        @RequestBody @Valid NovaMensagemDTO dto){
        Chat chat = chatService.buscarPorId(idChat);
        Mensagem mensagem = mensagemService.
        enviarMensagem(chat, dto.conteudo(), dto.autor());

        URI uri = URI.create("/chats/" + idChat + "/mensagens/" + mensagem.getIdMensagem());;
        return ResponseEntity.created(uri).
        body(MensagemResponseDTO.fromEntity(mensagem));
    }

    @PutMapping("/{idMensagem}")
    public ResponseEntity<MensagemResponseDTO> editarMensagem(@PathVariable Long id, 
        @RequestBody @Valid EditarMensagemDTO dto){
        return ResponseEntity.ok(MensagemResponseDTO.
            fromEntity(mensagemService.editarMensagem(id, dto.conteudo())));
        
    }

    @DeleteMapping("/{idMensagem}")
    public ResponseEntity<Void> deletarMensagem(@PathVariable Long idMensagem){
        mensagemService.deletarMensagem(idMensagem);
        return ResponseEntity.noContent().build();
    }
}


