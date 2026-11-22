package wisepath.code.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    public static final String[] ROTAS_FRONT = {
        "/login", "/cadastro", "/inicio", "/chat", "/chat/*", "/configuracoes", "/mapas", "/mapas/*"
    };

    // Lista repetida de propósito: anotações só aceitam constantes literais, não o array acima.
    @GetMapping({"/login", "/cadastro", "/inicio", "/chat", "/chat/*", "/configuracoes", "/mapas", "/mapas/*"})
    public String encaminharParaIndex() {
        return "forward:/index.html";
    }
}
