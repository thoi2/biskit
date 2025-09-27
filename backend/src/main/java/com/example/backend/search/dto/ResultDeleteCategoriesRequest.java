package com.example.backend.search.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class ResultDeleteCategoriesRequest {

    @NotEmpty
    private List<String> categories;
}
