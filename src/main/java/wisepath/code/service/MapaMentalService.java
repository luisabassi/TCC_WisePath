package wisepath.code.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import wisepath.code.model.MapaMental;
import wisepath.code.repository.MapaMentalRepository;

@Service
public class MapaMentalService {
    @Autowired private MapaMentalRepository mapaMentalRepository; 

    public MapaMentalService( MapaMentalRepository mapaMentalRepository){
        this.mapaMentalRepository = mapaMentalRepository;
    }

    @Transactional
    public MapaMental criarMapaMental(String jsonMapa){
        if(jsonMapa == null || jsonMapa.isBlank()){
            throw new IllegalArgumentException("O conteúdo do mapaMental não pode estar vazio.");
        }

        MapaMental mapaMental = new MapaMental();
        mapaMental.setJsonMapa(jsonMapa);
        return mapaMentalRepository.save(mapaMental);

    }

    @Transactional(readOnly = true)
    public MapaMental buscarPorId(Long idMapaMental){
        return mapaMentalRepository.findById(idMapaMental)
                .orElseThrow(() -> new IllegalArgumentException("Mapa mental não encontrado."));
    }

    @Transactional 
    public MapaMental atualizarMapaMental(Long idMapaMental, String jsonMapa){
        MapaMental mapaMental = buscarPorId(idMapaMental);

        if (jsonMapa != null && !jsonMapa.isBlank()){
            mapaMental.setJsonMapa(jsonMapa);
        }

        return mapaMentalRepository.save(mapaMental);
    }

    @Transactional
    public void deletarMapaMental(Long idMapaMental){
        if (!mapaMentalRepository.existsById(idMapaMental)) {
            throw new IllegalArgumentException("Mapa mental não encontrado.");
        }
        
        mapaMentalRepository.deleteById(idMapaMental);
    }

    public MapaMentalRepository getMapaMentalRepository(){
        return mapaMentalRepository;
    }

    public void setMapaMentalRepository(MapaMentalRepository mapaMentalRepository) {
        this.mapaMentalRepository = mapaMentalRepository;
    }
}
