package wisepath.code.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import wisepath.code.dto.AnaliseIADTO;
import wisepath.code.entity.Chat;
import wisepath.code.entity.Mensagem;

@Service
public class GeminiService {
    private final RestClient clienteRest;
    private final ObjectMapper mapeadorJson = new ObjectMapper();
    private final String chaveApi;

    private static final Logger registro = LoggerFactory.getLogger(GeminiService.class);

    private static final int MAX_TENTATIVAS = 3;

    private static final List<String> PERGUNTAS_IKIGAI = List.of(
        "o que a pessoa ama fazer (hobbies, atividades em que perde a noção do tempo) ",
        "no que a pessoa é naturalmente boa (habilidades pelas quais costuma ser elogiada) ",
        "o que a pessoa acha que o mundo precisa (causas, problemas que a movem) ",
        "pelo que a pessoa poderia ser paga (habilidades com valor de mercado)"
    );

    private static final String MENSAGEM_INICIAL = """
        Olá! Que bom ter você aqui. Eu sou o orientador do WisePath e vou te ajudar a descobrir carreiras que combinam com você usando o **Ikigai**, um conceito japonês que busca o ponto de encontro entre quatro dimensões da vida.

        **Como vai funcionar:**
        - Vou te fazer 4 perguntas, uma de cada vez: aquilo que você ama, aquilo que você é bom, o que o mundo precisa e pelo que você pode ser remunerado.
        - Responda com suas próprias palavras. Não existe resposta certa ou errada, e quanto mais sincero você for, melhor será o resultado.
        - Ao final, vou analisar tudo o que você contou e sugerir 3 profissões com média salarial, empregabilidade, tendências e cursos relacionados, além de montar o seu mapa mental do Ikigai.

        Vamos lá!""";

    public GeminiService(@Value("${gemini.api.url}") String urlApi,
            @Value("${gemini.api.key}") String chaveApi) {
        this.clienteRest = RestClient.builder().baseUrl(urlApi).build();
        this.chaveApi = chaveApi;
    }

    public AnaliseIADTO analisarChat(Chat chat) {
        String historico = montarHistorico(chat.getMensagens());
        String prompt = montarPrompt(historico);

        Map<String, Object> esquemaProfissao = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "nome", Map.of("type", "STRING"),
                "descricao", Map.of("type", "STRING"),
                "mediaSalarial", Map.of("type", "STRING"),
                "empregabilidade", Map.of("type", "STRING"),
                "tendenciasFuturas", Map.of("type", "STRING"),
                "comoComecar", Map.of("type", "STRING"),
                "cursosRelacionados", Map.of("type", "STRING")),
            "required", List.of("nome", "descricao", "mediaSalarial",
                "empregabilidade", "tendenciasFuturas",
                "comoComecar", "cursosRelacionados")
        );

        // Força o Gemini a devolver JSON no formato de AnaliseIADTO
        Map<String, Object> esquema = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "resumo", Map.of("type", "STRING"),
                "jsonMapaMental", Map.of("type", "STRING"),
                "profissoes", Map.of(
                    "type", "ARRAY",
                    "minItems", 3,
                    "maxItems", 3,
                    "items", esquemaProfissao
                )
            ),
            "required", List.of("resumo", "jsonMapaMental", "profissoes")
        );

        Map<String, Object> corpo = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            )),
            "generationConfig", Map.of(
                "responseMimeType", "application/json",
                "responseSchema", esquema,
                "temperature", 0.4 // respostas mais controladas
            )
        );

        Map<?, ?> resposta = chamarGemini(corpo);

        String textoJson = extrairTexto(resposta);

        try {
            return mapeadorJson.readValue(textoJson, AnaliseIADTO.class);
        } catch (JacksonException e) {
            registro.error("JSON inválido retornado pela IA: {}", textoJson, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A IA retornou uma resposta em formato inválido. Tente novamente.", e);
        }
    }

    public String responderMensagem(Chat chat) {
        return responderMensagem(chat.getMensagens());
    }

    // Recebe o histórico direto porque, na edição, ele ainda não está gravado no banco
    public String responderMensagem(List<Mensagem> mensagens) {
        long respostasDoUsuario = mensagens.stream()
            .filter(m -> m.getAutor() == Mensagem.AutorMensagem.USUARIO)
            .count();

        int indice = (int) respostasDoUsuario - 1;

        if (indice >= PERGUNTAS_IKIGAI.size()) {
            return "Obrigado por compartilhar tudo isso! Estou montando a sua análise de Ikigai...";
        }

        boolean primeiraMensagem = respostasDoUsuario <= 1;

        String historico = montarHistorico(mensagens);
        String prompt = montarPromptConversa(historico, Math.max(indice, 0), primeiraMensagem);

        Map<String, Object> corpo = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            ))
        );

        Map<?, ?> resposta = chamarGemini(corpo);

        String texto = extrairTexto(resposta).trim();

        // Na primeira mensagem, a explicação fixa vem antes da primeira pergunta
        return primeiraMensagem ? MENSAGEM_INICIAL + "\n\n" + texto : texto;
    }

    // Repete a chamada em falhas 5xx ou de rede, com espera crescente (1s, 2s, 4s...)
    private Map<?, ?> chamarGemini(Map<String, Object> corpo) {
        for (int tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
            try {
                return clienteRest.post()
                        .uri(construtorUri -> construtorUri.queryParam("key", chaveApi).build())
                        .body(corpo)
                        .retrieve()
                        .body(Map.class);
            } catch (HttpServerErrorException | ResourceAccessException e) {
                if (tentativa == MAX_TENTATIVAS) {
                    throw new ResponseStatusException(
                            HttpStatus.SERVICE_UNAVAILABLE,
                            "A IA está com alta demanda no momento. Tente novamente em instantes.", e);
                }
                try {
                    Thread.sleep(1000L * (1L << (tentativa - 1)));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ResponseStatusException(
                            HttpStatus.SERVICE_UNAVAILABLE, "Requisição interrompida.", ie);
                }
            }
        }
        throw new IllegalStateException("Inalcançável");
    }

    public String montarPromptConversa(String historico, int indice, boolean primeiraMensagem) {
        String regraReacao = primeiraMensagem
            ? "Uma mensagem de boas-vindas já foi enviada ao usuário: NÃO cumprimente e NÃO reaja à mensagem dele, vá direto à pergunta."
            : "Antes da pergunta, reaja à última mensagem do usuário em no máximo 1 frase curta.";

        return """
            Você é um orientador profissional acolhedor que conduz uma conversa
            guiada usando o conceito de Ikigai.

            Regras:
            - Faça EXATAMENTE UMA pergunta: a pergunta %d de %d, sobre %s.
            - Inclua exemplos de possíveis respostas àquela pergunta.
            - %s
            - NÃO faça outras perguntas, NÃO sugira profissões e NÃO dê conselhos ou análises ainda.
            - Responda apenas com o texto da mensagem, sem markdown, sem JSON e sem aspas.

            Conversa até agora:
            %s
            """.formatted(indice + 1, PERGUNTAS_IKIGAI.size(), PERGUNTAS_IKIGAI.get(indice), regraReacao, historico);
    }

    private String montarHistorico(List<Mensagem> mensagens) {
        StringBuilder historico = new StringBuilder();
        for (Mensagem mensagem : mensagens) {
            historico.append(mensagem.getAutor()).append(": ").append(mensagem.getConteudo()).append("\n");
        }

        return historico.toString();
    }

    private String montarPrompt(String historico) {
        return """
            Você é um orientador profissional especialista em Ikigai.
            Na conversa abaixo, o usuário respondeu sobre o que ama fazer, no que é bom,
            o que o mundo precisa e pelo que poderia ser pago. Gere a análise final.

            - "resumo": 3 a 5 frases conectando as 4 dimensões do Ikigai do usuário.

            //resposta que aparece na aba do mapa mental
            - "jsonMapaMental": uma STRING contendo um JSON válido, no formato:
                {"centro":"Ikigai","ramos":
                 [{"dimensao":"Paixão","itens":["..."]},
                 {"dimensao":"Talento","itens":["..."]},
                 {"dimensao":"Missão","itens":["..."]},
                 {"dimensao":"Vocação","itens":["..."]}]}
              Em "itens", use de 2 a 4 tópicos curtos por dimensão (no máximo 40 caracteres cada),
              em português, extraídos apenas do que o usuário disse; eles viram os nós do mapa mental.

            //resposta que aparece no chat
            - "profissoes": exatamente 3, da mais para a menos aderente ao perfil.
              - descricao: de 10 a 700 caracteres: o que a profissão faz e por que combina com ESTE usuário.
              - mediaSalarial: uma média salarial indo de um nível mais júnior até um nível mais sênior. Explicando essa faixa salarial.
              - empregabilidade: "Alta", "Média" ou "Baixa" seguida de uma justificativa curta.
              -- tendenciasFuturas: 2 a 3 frases sobre como a profissão deve evoluir nos próximos 5 a 10 anos no Brasil (impacto de IA e automação, demanda crescente ou em queda, novas habilidades exigidas). Não invente números ou estatísticas.
                Use apenas o que o usuário disse; não invente fatos sobre ele.
              -- comoComecar:  2 a 3 frases explicando como entrar na área que essa profissao se encaixa. 
              -- cursosRelacionados: cite quais cursos de faculdade a pessoa pode seguir no ensino superior. 
                Use apenas cursos existentes no Brasil, não invente fatos sobre eles. 

            Conversa:
            %s
            """.formatted(historico);
    }

    @SuppressWarnings("unchecked")
    private String extrairTexto(Map<?, ?> resposta) {
        if (resposta == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "A IA não retornou nenhuma resposta.");
        }

        var candidatos = (List<Map<String, Object>>) resposta.get("candidates");

        if (candidatos == null || candidatos.isEmpty()) {
            registro.warn("Gemini sem candidatos. Resposta bruta: {}", resposta);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                 "A IA não retornou uma resposta válida. Tente novamente.");
        }

        var conteudo = (Map<String, Object>) candidatos.get(0).get("content");
        var partes = conteudo != null ? (List<Map<String, Object>>) conteudo.get("parts") : null;

        if (partes == null || partes.isEmpty() || partes.get(0).get("text") == null) {
            registro.warn("Gemini com formato inesperado. Resposta bruta: {}", resposta);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "A IA retornou uma resposta em formato inesperado. Tente novamente.");
        }

        return (String) partes.get(0).get("text");
    }
}
