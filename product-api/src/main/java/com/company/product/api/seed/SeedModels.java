package com.company.product.api.seed;

import java.util.List;

public class SeedModels {
    public record SeedGroup(String code, String name, int courseYear) {}
    public record SeedLecture(String title, String summary, String content) {}
    public record SeedQuestion(String text, int points, List<SeedOption> options) {}
    public record SeedOption(String text, boolean correct) {}
}
