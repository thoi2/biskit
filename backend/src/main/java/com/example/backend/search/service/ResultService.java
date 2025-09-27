package com.example.backend.search.service;

import com.example.backend.common.exception.ErrorCode;
import com.example.backend.common.exception.BusinessException;
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

            Map<Integer, List<Double>> resultByCid = rows.stream()
                    .collect(Collectors.toMap(
                            InOutPort.InOutResult::categoryId,
                            InOutPort.InOutResult::result,
                            (a, b) -> a
                    ));

            // ✅ 내가 검색한 모든 카테고리를 점수순으로 정렬 (제한 없음)
            List<ResultGetResponse.Category> categories = cids.stream()
                    .map(cid -> {
                        String name = cidToName.get(cid);
                        List<Double> survivalRates = resultByCid.getOrDefault(cid, List.of());

                        // 평균 점수 계산 (5년차 우선, 없으면 전체 평균)
                        double avgScore = 0.0;
                        if (!survivalRates.isEmpty()) {
                            if (survivalRates.size() >= 5) {
                                // 5년차 생존율 우선 사용 (인덱스 4)
                                avgScore = survivalRates.get(4);
                            } else {
                                // 5년차가 없으면 전체 평균
                                avgScore = survivalRates.stream()
                                        .mapToDouble(Double::doubleValue)
                                        .average()
                                        .orElse(0.0);
                            }
                        }

                        return new ScoredCategory(
                                ResultGetResponse.Category.builder()
                                        .category(name)
                                        .survivalRate(survivalRates)
                                        .build(),
                                avgScore
                        );
                    })
                    .sorted((a, b) -> Double.compare(b.score, a.score)) // ✅ 점수 내림차순 정렬
                    // ✅ .limit() 제거 - 내 검색기록은 모두 표시
                    .map(scored -> scored.category)
                    .collect(Collectors.toList());

            items.add(ResultGetResponse.Item.builder()
                    .buildingId(bid)
                    .lat(lat)
                    .lng(lng)
                    .favorite(favorite)
                    .categories(categories) // ✅ 정렬된 모든 카테고리
                    .build());
        }

        // ✅ 전체 아이템도 최근 검색 순으로 정렬 (BFL 순서 유지)
        Map<Integer, ResultGetResponse.Item> itemByBid = items.stream()
                .collect(Collectors.toMap(
                        ResultGetResponse.Item::getBuildingId,
                        item -> item,
                        (a, b) -> a
                ));

        List<ResultGetResponse.Item> sortedItems = BFL.stream()
                .map(fav -> itemByBid.get(fav.getBuildingId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return ResultGetResponse.builder().items(sortedItems).build();
    }

    @Transactional
    public ResultDeleteResponse deleteBuilding(Long userId, int buildingId) {
        if(loginSearchPort.isFavorite(userId,buildingId))
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST,"찜 상태는 삭제할 수 없습니다");
        int affected = loginSearchPort.delete(userId, buildingId);

        return ResultDeleteResponse.builder()
                .buildingId(buildingId)
                .deletedCount(affected)
                .build();
    }

    @Transactional
    public ResultDeleteCategoriesResponse deleteCategories(Long userId, int buildingId, ResultDeleteCategoriesRequest req) {
        List<String> rawNames = (req == null ? Collections.emptyList() : req.getCategories());

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

    /**
     * ✅ 점수 계산용 헬퍼 레코드
     */
    private record ScoredCategory(ResultGetResponse.Category category, double score) {}
}
