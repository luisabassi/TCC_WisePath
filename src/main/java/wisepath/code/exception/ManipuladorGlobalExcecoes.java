package wisepath.code.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ManipuladorGlobalExcecoes {

    private static final Logger registro = LoggerFactory.getLogger(ManipuladorGlobalExcecoes.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarArgumentoInvalido(IllegalArgumentException excecao) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo(excecao.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> tratarIntegridadeDeDados(DataIntegrityViolationException excecao) {
        registro.error("Falha de integridade ao salvar dados", excecao);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(corpo("Não foi possível salvar os dados. Tente novamente."));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> tratarCredenciaisInvalidas(BadCredentialsException excecao) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(corpo("E-mail ou senha inválidos."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> tratarStatusDaResposta(ResponseStatusException excecao) {
        return ResponseEntity.status(excecao.getStatusCode()).body(corpo(excecao.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarValidacao(MethodArgumentNotValidException excecao) {
        String mensagem = excecao.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(erro -> erro.getDefaultMessage())
                .orElse("Dados inválidos.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo(mensagem));
    }

    private Map<String, String> corpo(String mensagem) {
        Map<String, String> erro = new LinkedHashMap<>();
        erro.put("mensagem", mensagem);
        return erro;
    }
}
