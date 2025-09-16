plugins {
    java
    id("org.springframework.boot") version "3.5.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"
description = "backend"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
// === 핵심 웹/데이터 처리 ===
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")       // JPA : 데이터베이스 ORM 및 엔티티 관리
    implementation("org.springframework.boot:spring-boot-starter-data-redis")     // Redis : 캐싱 및 NoSQL 데이터 저장
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")  // OAuth2 Client : 구글 소셜 로그인 인증
    implementation("org.springframework.boot:spring-boot-starter-security")       // Security : 인증/인가 보안 기능 제공
    implementation("org.springframework.boot:spring-boot-starter-validation")     // Validation : 입력 데이터 유효성 검증
    implementation("org.springframework.boot:spring-boot-starter-web")            // Web : REST API 웹 서버 구축
    implementation("org.springframework.boot:spring-boot-starter-webflux")        // WebFlux : 비동기 외부 API 호출 클라이언트

// === JWT 토큰 처리 ===
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")        // JWT API : JWT 토큰 생성/검증 인터페이스
    implementation("io.jsonwebtoken:jjwt-impl:0.12.6")       // JWT Impl : JWT 토큰 구현체
    implementation("io.jsonwebtoken:jjwt-jackson:0.12.6")    // JWT Jackson : JWT JSON 변환 처리

// === API 문서화 ===
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")  // Swagger : API 문서 자동 생성 및 UI 제공

// === 개발 편의성 도구 ===
    compileOnly("org.projectlombok:lombok")                    // Lombok : getter/setter 등 코드 자동 생성
    developmentOnly("org.springframework.boot:spring-boot-devtools")  // DevTools : 개발 중 자동 재시작 기능
    annotationProcessor("org.projectlombok:lombok")           // Lombok Processor : 어노테이션 처리

// === 데이터베이스 드라이버 ===
    runtimeOnly("com.mysql:mysql-connector-j")               // MySQL Driver : MySQL 데이터베이스 연결

// === 테스트 환경 ===
    testImplementation("org.springframework.boot:spring-boot-starter-test")      // Test : 통합 테스트 도구
    testImplementation("io.projectreactor:reactor-test")                        // Reactor Test : WebFlux 비동기 코드 테스트
    testImplementation("org.springframework.security:spring-security-test")     // Security Test : Security 관련 테스트 지원
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")              // JUnit Launcher : JUnit 테스트 실행 엔진
// === healthycheck ===
    implementation("org.springframework.boot:spring-boot-starter-actuator")
}


tasks.withType<Test> {
    useJUnitPlatform()
}
