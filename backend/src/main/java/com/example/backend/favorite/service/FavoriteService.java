package com.example.backend.favorite.service;

import com.example.backend.favorite.dto.FavoriteResponse;
import com.example.backend.search.port.LoginSearchPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final LoginSearchPort loginSearchPort;

    @Transactional
    public FavoriteResponse setFavorite(Long uid, int bid, boolean on) {

        loginSearchPort.set(uid, bid, on);

        return FavoriteResponse.of(bid, on);
    }
}
