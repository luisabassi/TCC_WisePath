package wisepath.code.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import wisepath.code.dto.EditarMensagemDTO;
import wisepath.code.dto.NovaMensagemDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;
import wisepath.code.service.ChatService;
import wisepath.code.service.MensagemService;

@RestController
public class MensagemController {
    private final MensagemService mensagemService; 
    private final ChatService chatService;

    public MensagemController(MensagemService mensagemService, ChatService chatService){
        this.mensagemService = mensagemService;
        this.chatService = chatService; 
    }

    @PostMapping("/chats/{idChat}/mensagens")
    public ResponseEntity<Mensagem> enviarMensagem(@PathVariable Long idChat, @RequestBody @Valid NovaMensagemDTO dto){
        Chat chat = chatService.buscarPorId(idChat);
        Mensagem mensagem = mensagemService.enviarMensagem(chat, dto.conteudo(), dto.autor());

        URI uri = URI.create("/mensagens/" + mensagem.getIdMensagem());
        return ResponseEntity.created(uri).body(mensagem);
    }

    @PutMapping("/mensagens/{id}")
    public ResponseEntity<Mensagem> editarMensagem(@PathVariable Long id, @RequestBody @Valid EditarMensagemDTO dto){
        return ResponseEntity.ok(mensagemService.editarMensagem(id, dto.conteudo()));
    }

    @DeleteMapping("/mensagens/{id}")
    public ResponseEntity<Void> deletarMensagem(@PathVariable Long idMensagem){
        mensagemService.deletarMensagem(idMensagem);
        return ResponseEntity.noContent().build();
    }
}


