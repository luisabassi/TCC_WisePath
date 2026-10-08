package wisepath.code.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wisepath.code.entity.Profissao;
import wisepath.code.repository.ProfissaoRepository;

@Service
public class ProfissaoService {
    private final ProfissaoRepository profissaoRepository;

    public ProfissaoService(ProfissaoRepository profissaoRepository) {
        this.profissaoRepository = profissaoRepository;
    }

    @Transactional(readOnly = true)
    public List<Profissao> listarTodos(){
        return profissaoRepository.findAll();
    }

    public List<Profissao> buscarPorNome(String nome){
        return profissaoRepository.findByNomeContainingIgnoreCase(nome);
    }

    @Transactional(readOnly = true)
    public Profissao buscarPorId(Long idProfissao) {
        return profissaoRepository.findById(idProfissao)
                .orElseThrow(() -> new IllegalArgumentException("Profissao nao encontrada."));
    }

    @Transactional
    public Profissao buscarOuCriarProfissao(String nome, String descricao, 
        String mediaSalarial, String empregabilidade, String tendenciasFuturas, 
        String comoComecar, String cursosRelacionados){
        if(nome == null || nome.isBlank()){
            throw new IllegalArgumentException("A profissão precisa ter um nome");
        }
        
        String nomeNormal = nome.trim(); 

        List<Profissao> encontradas = profissaoRepository.findByNomeContainingIgnoreCase(nomeNormal);
        for (Profissao profissao : encontradas) {
            if (profissao.getNome().equalsIgnoreCase(nomeNormal)) {
                return profissao;
            }
        }

        Profissao novaProfissao = new Profissao();
        novaProfissao.setNome(nomeNormal);
        novaProfissao.setDescricao(descricao);
        novaProfissao.setMediaSalarial(mediaSalarial);
        novaProfissao.setEmpregabilidade(empregabilidade);
        novaProfissao.setTendenciasFuturas(tendenciasFuturas);
        novaProfissao.setComoComecar(comoComecar);
        novaProfissao.setCursosRelacionados(cursosRelacionados);
        return profissaoRepository.save(novaProfissao);
    }



    @Transactional
    public Profissao atualizarProfissao(Long idProfissao, String descricao, 
        String mediaSalarial, String empregabilidade, String tendenciasFuturas, 
         String comoComecar, String cursosRelacionados) {

        Profissao profissao = buscarPorId(idProfissao);

        if (descricao != null && !descricao.isBlank()) {
            profissao.setDescricao(descricao);
        }

        if (mediaSalarial != null) {
            profissao.setMediaSalarial(mediaSalarial);
        }

        if (empregabilidade != null && !empregabilidade.isBlank()) {
            profissao.setEmpregabilidade(empregabilidade);
        }

        if (tendenciasFuturas != null && !tendenciasFuturas.isBlank()) {
            profissao.setTendenciasFuturas(tendenciasFuturas);
        }

        if(comoComecar != null && !comoComecar.isBlank()){
            profissao.setComoComecar(comoComecar);
        }

        if (cursosRelacionados != null && !cursosRelacionados.isBlank()) {
            profissao.setCursosRelacionados(cursosRelacionados);
        }

        return profissaoRepository.save(profissao);
    }
    

}
