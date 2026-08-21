package wisepath.code.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wisepath.code.entity.Chat;
import wisepath.code.entity.MapaMental;
import wisepath.code.entity.Profissao;
import wisepath.code.entity.Resultado;
import wisepath.code.repository.ResultadoRepository;
import wisepath.code.dto.SugestaoProfissao;

@Service
public class ResultadoService {

    private final ResultadoRepository resultadoRepository;
    private final ProfissaoService profissaoService;
    private final MapaMentalService mapaMentalService;

    public ResultadoService(ResultadoRepository resultadoRepository, ProfissaoService profissaoService, MapaMentalService mapaMentalService) {
        this.resultadoRepository = resultadoRepository;
        this.profissaoService = profissaoService;
        this.mapaMentalService = mapaMentalService;
    }


    @Transactional
    public Resultado gerarResultado(Chat chat, String resumo, String jsonMapaMental, List<SugestaoProfissao> sugestoes) {
        if (chat == null) {
            throw new IllegalArgumentException("O chat e obrigatorio para gerar um resultado.");
        }
        if (sugestoes == null || sugestoes.isEmpty()) {
            throw new IllegalArgumentException("E necessario informar ao menos uma profissao sugerida.");
        }

        MapaMental mapaMental = mapaMentalService.criarMapaMental(jsonMapaMental);

        List<Profissao> profissoes = new ArrayList<>();
        for (SugestaoProfissao sugestao : sugestoes) {
            Profissao profissao = profissaoService.buscarOuCriarProfissao(
                    sugestao.nome(),
                    sugestao.descricao(),
                    sugestao.mediaSalarial(),
                    sugestao.empregabilidade()
            );
            profissoes.add(profissao);
        }

        Resultado resultado = new Resultado();
        resultado.setResumo(resumo);
        resultado.setChat(chat);
        resultado.setMapaMental(mapaMental);
        resultado.setProfissoes(profissoes);

        return resultadoRepository.save(resultado);
    }

    @Transactional(readOnly = true)
    public Resultado buscarPorId(Long idResultado) {
        return resultadoRepository.findById(idResultado)
                .orElseThrow(() -> new IllegalArgumentException("Resultado nao encontrado."));
    }

    @Transactional(readOnly = true)
    public List<Resultado> listarPorChat(Long idChat) {
        return resultadoRepository.findByChatIdChatOrderByIdResultadoDesc(idChat);
    }

    @Transactional
    public void deletar(Long idResultado) {
        if (!resultadoRepository.existsById(idResultado)) {
            throw new IllegalArgumentException("Resultado nao encontrado.");
        }
        resultadoRepository.deleteById(idResultado);
    }
}
