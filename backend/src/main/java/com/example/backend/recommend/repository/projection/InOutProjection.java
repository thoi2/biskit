package com.example.backend.recommend.repository.projection;

import java.util.List;
public interface InOutProjection {
    int getCategoryId();
    List<Double> getResult();
}
