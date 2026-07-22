package wisepath.code.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email); // verifica se aquele email já existe no banco

    //Optional é uma classe que indica de forma explícita a ausência de um valor, evitando NullPointerException
}