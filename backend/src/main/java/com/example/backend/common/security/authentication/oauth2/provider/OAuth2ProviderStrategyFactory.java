package com.example.backend.common.security.authentication.oauth2.provider;

import com.example.backend.common.exception.BusinessException;
import com.example.backend.common.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * OAuth2 제공자 전략을 관리하는 팩토리 클래스
 * Spring이 자동으로 OAuth2ProviderStrategy 구현체들을 주입받아 관리합니다.
 */
@Component
public class OAuth2ProviderStrategyFactory {

    private final Map<String, OAuth2ProviderStrategy> strategies;

    /**
     * Spring이 OAuth2ProviderStrategy 구현체들을 자동으로 주입해줍니다.
     * @Component로 등록된 모든 OAuth2ProviderStrategy 구현체들이 List로 주입됩니다.
     *
     * @param strategies OAuth2ProviderStrategy 구현체들의 리스트
     */
    public OAuth2ProviderStrategyFactory(List<OAuth2ProviderStrategy> strategies) {
        this.strategies = strategies.stream()
            .collect(Collectors.toMap(
                strategy -> strategy.getProviderName().toLowerCase(),
                Function.identity()
            ));
    }

    /**
     * 제공자 이름에 해당하는 OAuth2 전략을 반환합니다.
     *
     * @param provider OAuth2 제공자 이름 (google, kakao, naver 등)
     * @return 해당 제공자의 OAuth2ProviderStrategy 구현체
     * @throws BusinessException 지원하지 않는 제공자인 경우
     */
    public OAuth2ProviderStrategy getStrategy(String provider) {
        OAuth2ProviderStrategy strategy = strategies.get(provider.toLowerCase());

        if (strategy == null) {
            throw new BusinessException(
                ErrorCode.AUTH_UNSUPPORTED_OAUTH2_PROVIDER,
                "지원하지 않는 OAuth2 제공자입니다: " + provider +
                    ". 지원 가능한 제공자: " + getSupportedProviders()
            );
        }

        return strategy;
    }

    /**
     * 현재 지원하는 모든 OAuth2 제공자 목록을 반환합니다.
     *
     * @return 지원하는 제공자 이름들의 Set
     */
    public Set<String> getSupportedProviders() {
        return strategies.keySet();
    }

    /**
     * 특정 제공자가 지원되는지 확인합니다.
     *
     * @param provider 확인할 제공자 이름
     * @return 지원 여부
     */
    public boolean isSupported(String provider) {
        return strategies.containsKey(provider.toLowerCase());
    }
}
