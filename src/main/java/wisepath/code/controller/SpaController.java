package wisepath.code.controller;

 
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    public static final  String[] ROTAS_FRONT = {
        "/login", "/cadastro","/inicio", "/chat", "/chat/*", "/configuracoes", "/mapas", "/mapas/*"
    };

    @GetMapping({"/login", "/cadastro","/inicio", "/chat", "/chat/*", "/configuracoes", "/mapas", "/mapas/*"})
    public String spa(){
        return "forward:/index.html";
    }
    
}