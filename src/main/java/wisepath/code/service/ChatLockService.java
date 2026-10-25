package wisepath.code.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

// Fila de execução por chat
@Component
public class ChatLockService {

    private static final long ESPERA_MAXIMA_SEGUNDOS = 90;

    private final ConcurrentHashMap<Long, Entrada> entradas = new ConcurrentHashMap<>();

    private static final class Entrada {
        final ReentrantLock lock = new ReentrantLock(true); // "justo": respeita a ordem de chegada
        int usos = 0; // threads usando ou esperando; só é alterado dentro de compute()
    }

    public <T> T executar(Long idChat, Supplier<T> acao) {
        Entrada entrada = entradas.compute(idChat, (id, atual) -> {
            Entrada e = atual != null ? atual : new Entrada();
            e.usos++;
            return e;
        });

        boolean adquiriu = false;
        try {
            adquiriu = entrada.lock.tryLock(ESPERA_MAXIMA_SEGUNDOS, TimeUnit.SECONDS);
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
            if (adquiriu) entrada.lock.unlock();
            // remove a entrada quando ninguém mais usa, para o mapa não crescer para sempre
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