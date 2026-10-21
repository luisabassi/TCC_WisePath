package wisepath.code.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import wisepath.code.dto.ProfissaoDTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.MapaMental;
import wisepath.code.entity.Profissao;
import wisepath.code.entity.Resultado;
import wisepath.code.repository.ResultadoRepository;

@Service
public class ResultadoService {

    private final ResultadoRepository resultadoRepository;
    private final ProfissaoService profissaoService;
    private final MapaMentalService mapaMentalService;

    public ResultadoService(ResultadoRepository resultadoRepository, 
        ProfissaoService profissaoService, 
        MapaMentalService mapaMentalService) {
        this.resultadoRepository = resultadoRepository;
        this.profissaoService = profissaoService;
        this.mapaMentalService = mapaMentalService;
    }


    @Transactional
    public Resultado gerarResultado(Chat chat, String resumo, String jsonMapaMental, List<ProfissaoDTO> profissaoDTO) {
        if (chat == null) {
            throw new IllegalArgumentException("O chat é obrigatório para gerar um resultado.");
        }
        if (resumo == null || resumo.isBlank()) {
            throw new IllegalArgumentException("O resumo é obrigatório para gerar um resultado.");
        }
        if (profissaoDTO == null || profissaoDTO.isEmpty()) {
            throw new IllegalArgumentException("É necessário informar ao menos uma profissão sugerida.");
        }

        MapaMental mapaMental = mapaMentalService.criarMapaMental(jsonMapaMental);

        List<Profissao> profissoes = new ArrayList<>();
        for (ProfissaoDTO dto : profissaoDTO) {
            if (dto.mediaSalarial() == null) {
                throw new IllegalArgumentException("A media salarial é obrigatória para cada profissao sugerida.");
            }

            Profissao profissao = profissaoService.buscarOuCriarProfissao(
                    dto.nome(),
                    dto.descricao(),
                    dto.mediaSalarial(),
                    dto.empregabilidade(), 
                    dto.tendenciasFuturas(),
                    dto.comoComecar(), 
                    dto.cursosRelacionados()
            );
            profissoes.add(profissao);
        }

        Resultado resultado = new Resultado();
        resultado.setResumo(resumo);
        resultado.setMapaMental(mapaMental);
        resultado.setProfissoes(profissoes);
        chat.adicionarResultado(resultado);

        return resultadoRepository.save(resultado);
    }

    @Transactional(readOnly = true)
    public Resultado buscarPorId(Long idResultado) {
        return resultadoRepository.findById(idResultado)
                .orElseThrow(() -> 
                new IllegalArgumentException("Resultado não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<Resultado> listarPorChat(Long idChat) {
        return resultadoRepository.findByChatIdChatOrderByIdResultadoDesc(idChat);
    }

    @Transactional(readOnly = true)
    public List<Resultado> listarPorUsuario(Long idUsuario){
        return resultadoRepository.findByChatUsuarioIdUsuarioOrderByIdResultadoDesc(idUsuario);
    }

    @Transactional
    public void deletar(Long idResultado) {
        if (!resultadoRepository.existsById(idResultado)) {
            throw new IllegalArgumentException("Resultado nao encontrado.");
        }
        resultadoRepository.deleteById(idResultado);
    }

    @Transactional(readOnly = true)
    public Resultado buscarResultadoDoUsuario(Long idResultado, Long idUsuarioLogado) {
        Resultado resultado = buscarPorId(idResultado);
        if (!resultado.getChat().getUsuario().getIdUsuario().equals(idUsuarioLogado)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar este resultado.");
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public Resultado buscarResultadoDoUsuarioPorMapaMental(Long idMapaMental, Long idUsuarioLogado) {
        Resultado resultado = resultadoRepository.findByMapaMentalIdMapaMental(idMapaMental)
                .orElseThrow(() -> new IllegalArgumentException("Mapa mental não encontrado."));
        if (!resultado.getChat().getUsuario().getIdUsuario().equals(idUsuarioLogado)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar este mapa mental.");
        }
        return resultado;
    }
 
}