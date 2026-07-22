package wisepath.code.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mapa_mental")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(of = "idMapaMental")
public class MapaMental {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMapaMental;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String jsonMapa;
}