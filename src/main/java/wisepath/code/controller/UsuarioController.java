package wisepath.code.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wisepath.code.service.UsuarioService;

@RestController
@RequestMapping("/users")
public class UsuarioController {

    private UsuarioService usuarioService;  

    

}