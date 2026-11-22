package wisepath.code.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wisepath.code.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
}