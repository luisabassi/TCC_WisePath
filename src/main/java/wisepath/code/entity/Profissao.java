package wisepath.code.entity;

import java.util.LinkedHashSet;
import java.util.Set;

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

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private  String mediaSalarial;

    @Column(length = 500)
    private String empregabilidade;

    @Column(columnDefinition = "TEXT")
    private String tendenciasFuturas;

    @Column(columnDefinition = "TEXT")
    private String comoComecar;

    @Column(columnDefinition = "TEXT")
    private String cursosRelacionados; 

    @ManyToMany(mappedBy = "profissoes")
    private Set<Resultado> resultados = new LinkedHashSet<>();
}