package com.example.backend.search.service;

import com.example.backend.search.dto.*;
import com.example.backend.search.port.LoginSearchPort;
import com.example.backend.search.port.SearchCategoryPort;
import com.example.backend.recommend.port.InOutPort;
import com.example.backend.recommend.port.BuildingPort;
import com.example.backend.recommend.port.CategoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final InOutPort inOutPort;
    private final BuildingPort buildingPort;
    private final CategoryPort categoryPort;
    private final SearchCategoryPort searchCategoryPort;
    private final LoginSearchPort loginSearchPort;

    @Transactional(readOnly = true)
    public ResultGetResponse getMyResults(Long userId) {
        var BFL = loginSearchPort.find(userId);
        if (BFL == null || BFL.isEmpty()) {
            return ResultGetResponse.builder().items(List.of()).build();
        }

        List<Integer> BIL = BFL.stream()
                .map(f -> f.getBuildingId())
                .distinct()
                .toList();

        var LLL = buildingPort.findByIdsList(BIL);
        Map<Integer, BuildingPort.BuildingPoint> pointByBid = LLL.stream()
                .collect(Collectors.toMap(BuildingPort.BuildingPoint::id, p -> p));

        Map<Integer, List<Integer>> BCL = new LinkedHashMap<>();
        for (int bid : BIL) {
            var rows = searchCategoryPort.find(userId, bid);
            var cids = rows.stream().map(r -> r.getCategoryId()).distinct().toList();
            BCL.put(bid, cids);
        }

        List<Integer> allCids = BCL.values()
                .stream()
                .flatMap(Collection::stream)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Integer, String> cidToName = categoryPort.getNamesByIds(allCids);

        Map<Integer, List<InOutPort.InOutResult>> inOutRows = inOutPort.findResultsByBidList(BCL);

        List<ResultGetResponse.Item> items = new ArrayList<>(BIL.size());

        for (var fav : BFL) {
            int bid = fav.getBuildingId();
            boolean favorite = fav.isFavorite();

            var ll = pointByBid.get(bid);
            if (ll == null|| ll.lat() == null || ll.lng() == null) continue;

            BigDecimal lat = ll.lat();
            BigDecimal lng = ll.lng();

            var cids = BCL.getOrDefault(bid, List.of());
            var rows = inOutRows.getOrDefault(bid, List.of());
            Map<Integer, Double> resultByCid = rows.stream()
                    .collect(Collectors.toMap(
                            InOutPort.InOutResult::categoryId,
                            InOutPort.InOutResult::result,
                            (a, b) -> a
                    ));

            List<ResultGetResponse.Category> categories = new ArrayList<>(cids.size());
            for (int cid : cids) {
                String name = cidToName.get(cid);         // 없으면 null 허용
                Double survival = resultByCid.get(cid);   // 없으면 null
                categories.add(ResultGetResponse.Category.builder()
                        .category(name)
                        .survivalRate(survival)
                        .build());
            }

            items.add(ResultGetResponse.Item.builder()
                    .buildingId(bid)
                    .lat(lat)
                    .lng(lng)
                    .favorite(favorite)
                    .categories(categories)
                    .build());
        }

        return ResultGetResponse.builder().items(items).build();
    }

    @Transactional
    public ResultDeleteResponse deleteBuilding(Long userId, int buildingId) {

        int affected = loginSearchPort.delete(userId, buildingId);

        return ResultDeleteResponse.builder()
                .buildingId(buildingId)
                .deletedCount(affected)
                .build();
    }

    @Transactional
    public ResultDeleteCategoriesResponse deleteCategories(Long userId, int buildingId, ResultDeleteCategoriesRequest req) {
        List<String> rawNames = (req == null ? Collections.emptyList() : req.getCategoryNames());

        List<String> names = rawNames == null ? Collections.emptyList()
                : rawNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();

        if (names.isEmpty()) {
            return ResultDeleteCategoriesResponse.builder()
                    .buildingId(buildingId)
                    .deletedCategoryNames(List.of())
                    .deletedCount(0)
                    .build();
        }

        List<Integer> categoryIds = names.stream()
                .map(categoryPort::getIdByName)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (categoryIds.isEmpty()) {
            return ResultDeleteCategoriesResponse.builder()
                    .buildingId(buildingId)
                    .deletedCategoryNames(List.of())
                    .deletedCount(0)
                    .build();
        }

        int deleted = searchCategoryPort.delete(userId, buildingId, categoryIds);

        return ResultDeleteCategoriesResponse.builder()
                .buildingId(buildingId)
                .deletedCategoryNames(names)
                .deletedCount(deleted)
                .build();
    }

}
