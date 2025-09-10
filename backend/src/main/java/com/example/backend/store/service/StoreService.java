package com.example.backend.store.service;

import com.example.backend.store.dto.BoundsRequest;
import com.example.backend.store.dto.StoreDto;
import com.example.backend.store.entity.Store;
import com.example.backend.store.repository.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoreService {

    @Autowired
    private StoreRepository storeRepository;

    public List<StoreDto> findStoresInBounds(BoundsRequest.Bounds bounds) {
        BigDecimal swLat = bounds.getSouthwest().getLat();
        BigDecimal swLng = bounds.getSouthwest().getLng();
        BigDecimal neLat = bounds.getNortheast().getLat();
        BigDecimal neLng = bounds.getNortheast().getLng();

        List<Store> stores = storeRepository.findStoresWithinBounds(swLat, swLng, neLat, neLng);
        
        return stores.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private StoreDto convertToDto(Store store) {
        StoreDto dto = new StoreDto();
        dto.setId(store.getId());
        dto.setStoreName(store.getStoreName());
        dto.setBranchName(store.getBranchName());
        dto.setBizCategoryCode(store.getBizCategoryCode());
        dto.setDongCode(store.getDongCode());
        dto.setRoadAddress(store.getRoadAddress());
        dto.setLat(store.getLat());
        dto.setLng(store.getLng());
        return dto;
    }
}
