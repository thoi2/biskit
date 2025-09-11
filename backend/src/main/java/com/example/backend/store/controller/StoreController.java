package com.example.backend.store.controller;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.store.dto.BoundsRequest;
import com.example.backend.store.dto.StoreDto;
import com.example.backend.store.service.StoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/store")
@Validated
public class StoreController {

    @Autowired
    private StoreService storeService;

    @PostMapping("/in-bounds")
    public ApiResponse<List<StoreDto>> getStoresInBounds(
            @Valid @RequestBody BoundsRequest request) {

        List<StoreDto> stores = storeService.findStoresInBounds(request.getBounds());
        return ApiResponse.of(stores);
    }
}
