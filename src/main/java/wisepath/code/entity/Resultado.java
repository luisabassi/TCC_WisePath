package wisepath.code.entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "resultado")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(of = "idResultado")
@ToString(exclude = {"chat", "mapaMental", "profissoes"})
public class Resultado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idResultado;

    @Column
    private String resumo;

    @ManyToOne
    @JoinColumn(name = "idChat", nullable = false)
    private Chat chat;

    @OneToOne
    @JoinColumn(name = "idMapa", nullable = false)
    private MapaMental mapaMental;

    @ManyToMany(cascade = CascadeType.PERSIST)
    @JoinTable(
        name = "resultado_profissao",
        joinColumns = @JoinColumn(name = "idResultado"),
        inverseJoinColumns = @JoinColumn(name = "idProfissao")
    )
    private List<Profissao> profissoes;
}