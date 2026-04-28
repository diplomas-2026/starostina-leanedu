package com.company.product.api.service;

import com.company.product.api.dto.AiDtos;
import com.company.product.api.entity.*;
import com.company.product.api.llm.GigachatProperties;
import com.company.product.api.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {
    private final GigachatProperties gigachatProperties;
    private final AiDailyUsageRepository aiDailyUsageRepository;
    private final AiGenerationRepository aiGenerationRepository;
    private final LectureRepository lectureRepository;
    private final LearningTestRepository learningTestRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ObjectMapper objectMapper;
    private final ChatClient.Builder chatClientBuilder;
    @Value("${spring.ai.openai.api-key:demo-key}")
    private String apiKey;

    public AiDtos.AiLimitsResponse getLimits() {
        LocalDate today = LocalDate.now(ZoneId.of(gigachatProperties.getTimezone()));
        int used = aiDailyUsageRepository.findByUsageDate(today).map(AiDailyUsage::getUsedTokens).orElse(0);
        int remaining = Math.max(0, gigachatProperties.getDailyLimit() - used);
        ZonedDateTime nextReset = today.plusDays(1).atStartOfDay(ZoneId.of(gigachatProperties.getTimezone()));
        return new AiDtos.AiLimitsResponse(gigachatProperties.getDailyLimit(), used, remaining, nextReset.toOffsetDateTime());
    }

    @Transactional
    public LearningTest generateDraftFromLecture(Long lectureId, AppUser user) {
        Lecture lecture = lectureRepository.findById(lectureId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена"));

        LocalDate today = LocalDate.now(ZoneId.of(gigachatProperties.getTimezone()));
        AiDailyUsage usage = aiDailyUsageRepository.findByUsageDate(today).orElseGet(() -> {
            AiDailyUsage created = new AiDailyUsage();
            created.setUsageDate(today);
            created.setUsedTokens(0);
            return created;
        });

        int remaining = gigachatProperties.getDailyLimit() - usage.getUsedTokens();
        if (remaining <= 0) {
            saveGeneration(user, lecture, AiGenerationStatus.REJECTED_BY_LIMIT, "{}", 0, 0, 0, "limit");
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Суточный лимит токенов исчерпан. Сброс в 00:00 (Самара)");
        }

        String prompt = "Сгенерируй тест по лекции. Верни строго JSON формата {\"title\":string,\"description\":string,\"questions\":[{\"text\":string,\"points\":int,\"explanation\":string,\"options\":[{\"text\":string,\"correct\":boolean}]}]}. " +
            "Нужно 5 вопросов, каждый с 4 вариантами и одним правильным ответом. Язык русский. Текст лекции: " + lecture.getContent();

        String raw;
        int promptTokens;
        int completionTokens;
        int totalTokens;
        if ("demo-key".equals(apiKey)) {
            raw = """
                {"title":"AI тест по лекции","description":"Черновик теста по материалу лекции","questions":[
                {"text":"Что является ключевой целью бережливого производства?","points":2,"explanation":"Главная цель — создать ценность для клиента с минимальными потерями.","options":[{"text":"Увеличить объём складских запасов","correct":false},{"text":"Максимизировать ценность и убрать потери","correct":true},{"text":"Сократить количество сотрудников","correct":false},{"text":"Увеличить бюрократию","correct":false}]},
                {"text":"Какой инструмент относится к Lean?","points":2,"explanation":"5S — базовый инструмент организации рабочего места.","options":[{"text":"5S","correct":true},{"text":"SWOT","correct":false},{"text":"PEST","correct":false},{"text":"Waterfall","correct":false}]}
                ]}
                """;
            promptTokens = estimateTokens(prompt);
            completionTokens = estimateTokens(raw);
            totalTokens = promptTokens + completionTokens;
        } else {
            ChatClient chatClient = chatClientBuilder.build();
            ChatResponse response = chatClient.prompt().user(prompt).call().chatResponse();
            raw = response.getResult().getOutput().getText();

            Usage responseUsage = response.getMetadata() != null ? response.getMetadata().getUsage() : null;
            promptTokens = responseUsage != null && responseUsage.getPromptTokens() != null ? responseUsage.getPromptTokens().intValue() : estimateTokens(prompt);
            completionTokens = responseUsage != null && responseUsage.getCompletionTokens() != null ? responseUsage.getCompletionTokens().intValue() : estimateTokens(raw);
            totalTokens = responseUsage != null && responseUsage.getTotalTokens() != null ? responseUsage.getTotalTokens().intValue() : (promptTokens + completionTokens);
        }

        if (usage.getUsedTokens() + totalTokens > gigachatProperties.getDailyLimit()) {
            saveGeneration(user, lecture, AiGenerationStatus.REJECTED_BY_LIMIT, raw, promptTokens, completionTokens, totalTokens, prompt);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Недостаточно токенов в дневном лимите для этой генерации");
        }

        Map<String, Object> parsed;
        try {
            parsed = objectMapper.readValue(raw, objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        } catch (Exception ex) {
            saveGeneration(user, lecture, AiGenerationStatus.ERROR, raw, promptTokens, completionTokens, totalTokens, prompt);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "LLM вернула невалидный ответ, попробуйте ещё раз");
        }

        LearningTest test = new LearningTest();
        test.setTitle((String) parsed.getOrDefault("title", "AI тест по лекции"));
        test.setDescription((String) parsed.getOrDefault("description", "Черновик, сгенерированный LLM"));
        test.setLecture(lecture);
        test.setSubject(lecture.getSubject());
        test.setPublished(false);
        test.setTimeLimitMin(20);
        test.setAttemptsLimit(3);
        test.setMinScore3(5);
        test.setMinScore4(7);
        test.setMinScore5(9);
        test.setCreatedBy(user);
        test = learningTestRepository.save(test);

        List<Map<String, Object>> questions = (List<Map<String, Object>>) parsed.get("questions");
        if (questions != null) {
            int i = 1;
            for (Map<String, Object> questionMap : questions) {
                Question question = new Question();
                question.setTest(test);
                question.setText((String) questionMap.getOrDefault("text", "Вопрос"));
                question.setPoints(((Number) questionMap.getOrDefault("points", 1)).intValue());
                question.setSortOrder(i++);
                question = questionRepository.save(question);

                List<Map<String, Object>> options = (List<Map<String, Object>>) questionMap.get("options");
                if (options != null) {
                    for (Map<String, Object> optionMap : options) {
                        QuestionOption option = new QuestionOption();
                        option.setQuestion(question);
                        option.setText((String) optionMap.getOrDefault("text", "Вариант"));
                        option.setCorrect(Boolean.TRUE.equals(optionMap.get("correct")));
                        questionOptionRepository.save(option);
                    }
                }
            }
        }

        usage.setUsedTokens(usage.getUsedTokens() + totalTokens);
        aiDailyUsageRepository.save(usage);
        saveGeneration(user, lecture, AiGenerationStatus.SUCCESS, raw, promptTokens, completionTokens, totalTokens, prompt);

        return test;
    }

    private void saveGeneration(AppUser user, Lecture lecture, AiGenerationStatus status, String response, int promptTokens, int completionTokens, int totalTokens, String prompt) {
        AiGeneration generation = new AiGeneration();
        generation.setUser(user);
        generation.setLecture(lecture);
        generation.setStatus(status);
        generation.setModel(gigachatProperties.getModel());
        generation.setPromptHash(sha256(prompt));
        generation.setResponseJson(response == null ? "{}" : response);
        generation.setPromptTokens(promptTokens);
        generation.setCompletionTokens(completionTokens);
        generation.setTotalTokens(totalTokens);
        generation.setCreatedAt(OffsetDateTime.now());
        aiGenerationRepository.save(generation);
    }

    private String sha256(String source) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            return "hash_error";
        }
    }

    private int estimateTokens(String text) {
        return Math.max(1, text.length() / 4);
    }
}
