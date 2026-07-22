package wisepath.code.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "profissao")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(of = "idProfissao")
@ToString(exclude = "resultados")
public class Profissao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProfissao;

    @Column(nullable = false)
    private String nome;

    @Column
    private String descricao;

    @Column
    private Double mediaSalarial;

    @Column
    private String empregabilidade;

    @ManyToMany(mappedBy = "profissoes")
    private List<Resultado> resultados;
}