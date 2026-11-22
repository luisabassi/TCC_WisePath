package wisepath.code.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Serializa as operações de um mesmo chat (mensagens, edição, exclusão e análise),
 * já que todas leem ou alteram o histórico completo. Chats diferentes não se bloqueiam.
 */
@Component
public class FilaChatService {

    private static final long ESPERA_MAXIMA_SEGUNDOS = 90;

    private final ConcurrentHashMap<Long, Entrada> entradas = new ConcurrentHashMap<>();

    private static final class Entrada {
        final ReentrantLock trava = new ReentrantLock(true); // justa: respeita a ordem de chegada
        int usos = 0; // threads usando ou esperando; só é alterado dentro de compute()
    }

    public <T> T executar(Long idChat, Supplier<T> acao) {
        Entrada entrada = entradas.compute(idChat, (id, atual) -> {
            Entrada nova = atual != null ? atual : new Entrada();
            nova.usos++;
            return nova;
        });

        boolean adquiriu = false;
        try {
            adquiriu = entrada.trava.tryLock(ESPERA_MAXIMA_SEGUNDOS, TimeUnit.SECONDS);
            if (!adquiriu) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Esta conversa ainda está processando outra solicitação. Tente novamente em instantes.");
            }
            return acao.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "A solicitação foi interrompida. Tente novamente.");
        } finally {
            if (adquiriu) entrada.trava.unlock();
            // sem usuários, a entrada sai do mapa para ele não crescer indefinidamente
            entradas.compute(idChat, (id, atual) -> {
                atual.usos--;
                return atual.usos == 0 ? null : atual;
            });
        }
    }

    public void executarSemRetorno(Long idChat, Runnable acao) {
        executar(idChat, () -> {
            acao.run();
            return null;
        });
    }
}
