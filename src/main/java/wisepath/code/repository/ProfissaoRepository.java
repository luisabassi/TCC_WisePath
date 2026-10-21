package wisepath.code.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Profissao;

public interface ProfissaoRepository extends JpaRepository<Profissao, Long> {
   List<Profissao> findByNomeContainingIgnoreCase(String nome);

   Optional<Profissao> findByNomeIgnoreCase(String nome);

}