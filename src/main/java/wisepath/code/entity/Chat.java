package wisepath.code.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "chat")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(of = "idChat")
@ToString(exclude = {"mensagens", "resultados", "usuario"})
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idChat;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;

    @OneToMany(mappedBy = "chat", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Mensagem> mensagens = new ArrayList<>();

    @OneToMany(mappedBy = "chat", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Resultado> resultados = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    private Usuario usuario;

    public void adicionarResultado(Resultado novoResultado) {
        this.resultados.add(novoResultado);
    }

    // CascadeType.PERSIST:
    // Quando a entidade pai é salva pela primeira vez no banco,
    // as entidades filhas também são automaticamente salvas.

    // CascadeType.MERGE:
    // Quando as alterações da entidade pai são atualizadas no banco,
    // as entidades filhas também têm seus dados atualizados.
}