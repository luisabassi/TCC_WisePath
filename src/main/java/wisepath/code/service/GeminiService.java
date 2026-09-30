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
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private static final int MAX_TENTATIVAS = 3;

    // Roteiro fixo do Ikigai: o backend controla em qual pergunta a conversa está.
    private static final List<String> PERGUNTAS_IKIGAI = List.of(
        "o que a pessoa ama fazer (hobbies, atividades em que perde a noção do tempo)",
        "no que a pessoa é naturalmente boa (habilidades pelas quais costuma ser elogiada)",
        "o que a pessoa acha que o mundo precisa (causas, problemas que a movem)",
        "pelo que a pessoa poderia ser paga (habilidades com valor de mercado)"
    );

    public GeminiService(@Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.key}") String apiKey) {
        this.restClient = RestClient.builder().baseUrl(apiUrl).build();
        this.apiKey = apiKey;
    }

    public AnaliseIADTO analisarChat(Chat chat){
        String historico = montarHistorico(chat.getMensagens());
        String prompt = montarPrompt(historico);

        Map<String,Object> profissao = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "nome", Map.of("type", "STRING"),
                "descricao", Map.of("type", "STRING"),
                "mediaSalarial", Map.of("type", "NUMBER"),
                "empregabilidade", Map.of("type", "STRING"),
                "tendenciasFuturas", Map.of("type", "STRING")  
    ),
    "required", List.of("nome", "descricao", "mediaSalarial",
                        "empregabilidade", "tendenciasFuturas")   // novo
);

        Map<String,Object> schema = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                "resumo", Map.of("type", "STRING"),
                "jsonMapaMental", Map.of("type", "STRING"),
                "profissoes", Map.of(
                    "type", "ARRAY",
                    "minItems", 3,
                    "maxItems", 3,
                    "items", profissao
                )
            ),
            "required", List.of("resumo", "jsonMapaMental", "profissoes")
        );

        Map<String,Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts",List.of(Map.of("text",prompt))
            )),
            "generationConfig",Map.of(
                "responseMimeType", "application/json",
                "responseSchema", schema,
                "temperature", 0.4
            )
        );

        Map<?,?> resposta = chamarGemini(body);

        String textoJson = extrairTexto(resposta);

        try {
            return objectMapper.readValue(textoJson, AnaliseIADTO.class);
        } catch (JacksonException e) {
            log.error("JSON inválido retornado pela IA: {}", textoJson, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A IA retornou uma resposta em formato inválido. Tente novamente.", e);
        }
    }

    //fala natural do chatbot: uma pergunta do roteiro Ikigai por vez
    public String responderMensagem(Chat chat){
        long respostasDoUsuario = chat.getMensagens().stream()
            .filter(m -> m.getAutor() == Mensagem.AutorMensagem.USUARIO)
            .count();

        int indice = (int) respostasDoUsuario - 1;

        if (indice >= PERGUNTAS_IKIGAI.size()) {
            return "Obrigado por compartilhar tudo isso! Estou montando a sua análise de Ikigai...";
        }

        String historico = montarHistorico(chat.getMensagens());
        String prompt = montarPromptConversa(historico, Math.max(indice, 0));

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            ))
        );

        Map<?,?> resposta = chamarGemini(body);

        return extrairTexto(resposta).trim();
    }

    private Map<?,?> chamarGemini(Map<String, Object> body) {
        for (int tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
            try {
                return restClient.post()
                        .uri(uriBuilder -> uriBuilder.queryParam("key", apiKey).build())
                        .body(body)
                        .retrieve()
                        .body(Map.class);
            } catch (HttpServerErrorException | ResourceAccessException e) {
                // 5xx (503 alta demanda, 500, 504) e falhas de rede/timeout
                if (tentativa == MAX_TENTATIVAS) {
                    throw new ResponseStatusException(
                            HttpStatus.SERVICE_UNAVAILABLE,
                            "A IA está com alta demanda no momento. Tente novamente em instantes.", e);
                }
                try {
                    Thread.sleep(1000L * (1L << (tentativa - 1))); // 1s, 2s, 4s...
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new ResponseStatusException(
                            HttpStatus.SERVICE_UNAVAILABLE, "Requisição interrompida.", ie);
                }
            }
        }
        throw new IllegalStateException("Inalcançável");
    }

    public String montarPromptConversa(String historico, int indice){
        return """
            Você é um orientador profissional acolhedor que conduz uma conversa
            guiada usando o conceito de Ikigai.

            Regras:
            - Faça EXATAMENTE UMA pergunta: a pergunta %d de %d, sobre %s.
            - Antes da pergunta, reaja à última mensagem do usuário em no máximo 1 frase curta.
            - NÃO faça outras perguntas, NÃO sugira profissões e NÃO dê conselhos ou análises ainda.
            - Responda apenas com o texto da mensagem, sem markdown, sem JSON e sem aspas.

            Conversa até agora:
            %s
            """.formatted(indice + 1, PERGUNTAS_IKIGAI.size(), PERGUNTAS_IKIGAI.get(indice), historico);
    }

    private String montarHistorico(List<Mensagem> mensagens){
        StringBuilder sb = new StringBuilder();
        for(Mensagem m: mensagens){
            sb.append(m.getAutor()).append(": " ).append(m.getConteudo()).append("\n");
        }

        return sb.toString();
    }

    private String montarPrompt(String historico) {
        return """
            Você é um orientador profissional especialista em Ikigai.
            Na conversa abaixo, o usuário respondeu sobre o que ama fazer, no que é bom,
            o que o mundo precisa e pelo que poderia ser pago. Gere a análise final.

            - "resumo": 3 a 5 frases conectando as 4 dimensões do Ikigai do usuário.
            - "jsonMapaMental": uma STRING contendo um JSON válido, no formato:
              {"centro":"Ikigai","ramos":[{"dimensao":"Paixão","itens":["..."]},{"dimensao":"Talento","itens":["..."]},{"dimensao":"Missão","itens":["..."]},{"dimensao":"Vocação","itens":["..."]}]}
            - "profissoes": exatamente 3, da mais para a menos aderente ao perfil.
              - descricao: de 10 a 700 caracteres: o que a profissão faz e por que combina com ESTE usuário.
              - mediaSalarial: número, média salarial mensal em reais (BRL) no Brasil, sem símbolo nem texto.
              - empregabilidade: "Alta", "Média" ou "Baixa" seguida de uma justificativa curta.
              -- tendenciasFuturas: 2 a 3 frases sobre como a profissão deve evoluir nos próximos 5 a 10 anos no Brasil (impacto de IA e automação, demanda crescente ou em queda, novas habilidades exigidas). Não invente números ou estatísticas.
            Use apenas o que o usuário disse; não invente fatos sobre ele.

            Conversa:
            %s
            """.formatted(historico);
    }

    @SuppressWarnings("unchecked")
    private String extrairTexto(Map<?,?> resposta){
        if(resposta == null){
           throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "A IA não retornou nenhuma resposta.");
        }

        var candidates = (List<Map<String, Object>>) resposta.get("candidates");
        if(candidates == null || candidates.isEmpty()){
            log.warn("Gemini sem candidatos. Resposta bruta: {}", resposta);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "A IA não retornou uma resposta válida. Tente novamente.");
        }

        var content = (Map<String, Object>) candidates.get(0).get("content");
        var parts = content != null ? (List<Map<String, Object>>) content.get("parts") : null;
        if(parts == null || parts.isEmpty() || parts.get(0).get("text") == null) {
            log.warn("Gemini com formato inesperado. Resposta bruta: {}", resposta);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "A IA retornou uma resposta em formato inesperado. Tente novamente.");
        }

       return (String) parts.get(0).get("text");
    }
}