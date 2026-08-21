package wisepath.code.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wisepath.code.entity.Usuario;
import wisepath.code.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private static final int TAMANHO_MINIMO_SENHA = 8;

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario cadastrar (Usuario usuario){
        if (usuario.getNome() == null || usuario.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome é obrigatório.");
        }
        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            throw new IllegalArgumentException("O e-mail é obrigatório.");
        }
        if (usuario.getSenha() == null || usuario.getSenha().length() < TAMANHO_MINIMO_SENHA) {
            throw new IllegalArgumentException("A senha deve ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
        }
        if(usuarioRepository.existsByEmail(usuario.getEmail())){
            throw new IllegalArgumentException("Email já cadastrado");
        }
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public Usuario autenticar(String email, String senhaDigitada) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(senhaDigitada, usuario.getSenha())) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }

        return usuario;
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorId(Long idUsuario) {
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    @Transactional
    public Usuario atualizarPerfil(Long idUsuario, String novoNome, String novoEmail, String novaSenha) {

        Usuario usuario = usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if(novoNome != null && !novoNome.isBlank()){
            usuario.setNome(novoNome);
        }

        if (novoEmail != null && !novoEmail.isBlank() && !novoEmail.equalsIgnoreCase(usuario.getEmail())){
            if(usuarioRepository.existsByEmail(novoEmail)){
                throw new IllegalArgumentException("Email já cadastrado");
            }

            usuario.setEmail(novoEmail);
        }

        if (novaSenha != null && !novaSenha.isBlank()) {
            usuario.setSenha(passwordEncoder.encode(novaSenha));
        }

        return usuarioRepository.save(usuario);

    }

    public UsuarioRepository getUsuarioRepository() {
        return usuarioRepository;
    }

    public void setUsuarioRepository(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public PasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }

    public void setPasswordEncoder(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
}
//@Autowired -> injeção de dependência automática