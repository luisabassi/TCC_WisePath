# WisePath

Aplicação web de orientação profissional para estudantes do Ensino Médio. Por meio de uma conversa guiada baseada no **Ikigai**, uma IA (Google Gemini) faz quatro perguntas sobre o que a pessoa ama, no que é boa, o que o mundo precisa e pelo que pode ser remunerada. Ao final, sugere **3 profissões** (salário, empregabilidade, tendências, como começar e cursos) e monta um **mapa mental** interativo do Ikigai.

## Tecnologias

| Camada | Stack |
|---|---|
| Back-end | Java 25, Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation), JWT (jjwt), Lombok |
| Banco de dados | MySQL |
| IA | API do Google Gemini (resposta estruturada em JSON) |
| Front-end | HTML, CSS e JavaScript puro (SPA sem framework, servida pelo próprio Spring) |

## Pré-requisitos

- JDK 25
- MySQL em execução em `localhost:3306`
- Chave da API do Gemini

## Como executar

1. Configure `src/main/resources/application.properties` (ou, melhor, variáveis de ambiente):

   | Propriedade | Descrição |
   |---|---|
   | `gemini.api.key` | Chave da API do Gemini |
   | `gemini.api.url` | Endpoint do modelo Gemini |
   | `spring.datasource.url` / `username` / `password` | Conexão MySQL (o banco `wisepath` é criado automaticamente) |
   | `jwt.secret` | Chave Base64 de 256 bits para assinar os tokens |
   | `jwt.expiration-ms` | Validade do token (padrão: 24 h) |

2. Suba a aplicação:

   ```bash
   ./mvnw spring-boot:run
   ```

3. Acesse <http://localhost:8080>. As tabelas são criadas pelo Hibernate (`ddl-auto=update`).

> **Segurança:** não versione chaves nem senhas. Use variáveis de ambiente (ex.: `GEMINI_API_KEY`, `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`) e gere uma nova chave se alguma já tiver sido exposta.

## Estrutura do projeto

```
src/main
├── java/wisepath/code
│   ├── config/         ConfiguracaoSeguranca (rotas públicas, JWT stateless, BCrypt)
│   ├── controller/     Endpoints REST e SpaController (rotas do front)
│   ├── dto/            Objetos de entrada (…DTO) e de saída (…RespostaDTO)
│   ├── entity/         Usuario, Chat, Mensagem, Resultado, Profissao, MapaMental
│   ├── exception/      ManipuladorGlobalExcecoes (erros em JSON {"mensagem": "..."})
│   ├── repository/     Repositórios Spring Data JPA
│   ├── security/       JwtService e FiltroAutenticacaoJwt
│   └── service/        Regras de negócio, GeminiService e FilaChatService
└── resources
    ├── application.properties
    └── static
        ├── index.html
        ├── assets/     Imagens
        ├── css/        Estilos por área (base, auth, welcome, settings, chat, maps)
        ├── views/      Templates HTML (um arquivo por tela, com vários <template>)
        └── js/
            ├── app.js, estado.js          Inicialização, estado global e roteador
            ├── modelos.js                 Carrega /views e preenche os templates
            ├── componentes.js             Peças reutilizáveis (avatar, cabeçalho, feedback…)
            ├── api.js, autenticacao.js    Chamadas HTTP e sessão (token no localStorage)
            ├── mapa-mental.js             Disposição, desenho SVG, exportação PNG e cache
            └── telas/                     Lógica de cada tela
```

## Front-end: como o JS usa os templates HTML

Todo o markup fica em `static/views`. Na inicialização, `Modelos.carregar()` busca os arquivos e registra cada `<template id="...">` como `"arquivo/id"`. As telas pedem um fragmento e o inserem no DOM:

```js
raiz.replaceChildren(Modelos.criar("cadastro/tela", { dicaSenha: "Mínimo 8 caracteres" }));
```

Os templates se ligam aos dados por atributos, sem concatenar strings HTML:

| Diretiva | Efeito |
|---|---|
| `data-texto="chave"` | Define o `textContent` (sem risco de injeção de HTML) |
| `data-valor="chave"` | Define o `value` de campos |
| `data-conteudo="chave"` | Substitui os filhos por um nó/fragmento |
| `data-attr="atributo:chave;…"` | Define atributos (ignora `null`, `undefined` e `false`) |
| `data-se` / `data-senao` | Mantém o elemento conforme um valor verdadeiro/falso |
| `data-encaixe="nome"` | Troca o elemento por outro fragmento (composição) |
| `data-icone="nome"` | Insere um ícone de `views/icones.html` |

Para criar uma tela nova: adicione `views/<tela>.html`, inclua o nome em `Modelos.ARQUIVOS`, crie `js/telas/<tela>.js` com `Telas.<tela> = { renderizar(raiz) {…} }` e registre a rota em `estado.js`.

## API REST

Todas as rotas, exceto `POST /usuarios` e `POST /usuarios/login`, exigem o cabeçalho `Authorization: Bearer <token>`.

| Recurso | Rotas |
|---|---|
| Usuários | `POST /usuarios`, `POST /usuarios/login`, `GET\|PUT\|DELETE /usuarios/{id}` |
| Chats | `POST /chats`, `GET /chats/{id}`, `PUT /chats/{id}`, `DELETE /chats/{id}`, `GET /chats/usuario/{id}`, `GET /chats/busca?nome=` |
| Mensagens | `GET /chats/{id}/mensagens`, `POST /chats/{idChat}/mensagens`, `PUT\|DELETE /chats/{idChat}/mensagens/{idMensagem}` |
| Resultado | `POST /chats/{idChat}/resultado`, `GET /chats/{idChat}/resultado`, `GET\|DELETE /chats/{idChat}/resultado/{idResultado}` |
| Mapas mentais | `GET /mapamental`, `GET\|PUT\|DELETE /mapamental/{id}` |
| Profissões | `GET /profissoes`, `GET /profissoes/{id}`, `GET /profissoes/busca`, `GET /profissoes/resultado/{idResultado}` |

## Regras de negócio

- **Roteiro do Ikigai:** o chatbot faz uma pergunta por vez (4 no total); após as respostas, a análise é gerada e o mapa mental é criado.
- **A IA responde antes de gravar:** se a chamada ao Gemini falhar, nada é salvo no banco.
- **Edição e exclusão de mensagens:** só mensagens do usuário; as posteriores e o resultado já gerado são apagados.
- **Conflito entre abas (HTTP 409):** o front envia o id da última mensagem conhecida; se o chat mudou em outra janela, o servidor recusa o envio.
- **Fila por chat:** `FilaChatService` serializa operações do mesmo chat, sem bloquear chats diferentes.
- **Tolerância a falhas da IA:** até 3 tentativas com espera crescente em erros 5xx ou de rede.

## Rotas do front-end

`/cadastro`, `/login`, `/inicio`, `/chat`, `/chat/{id}`, `/configuracoes`, `/mapas` e `/mapas/{id}`. O Spring encaminha todas para `index.html`, e o roteador do JS redireciona para `/login` quem não está autenticado.

## Convenções de código

- Nomes de classes, métodos, variáveis e parâmetros em português; ficam em inglês apenas palavras reservadas, APIs de bibliotecas e os sufixos de camada (`Service`, `Controller`, `Repository`, `DTO`).
- Comentários só para regras de negócio e trechos críticos.
