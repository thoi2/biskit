# 1. Gitlab 소스 클론 이후 빌드 및 배포

## 1.1 사용 기술 및 버전 정보

### **A. Backend (Spring Boot)**

#### **JVM 및 빌드 도구**
- **Java**: OpenJDK 21
- **Spring Boot**: 3.5.5
- **Spring Dependency Management**: 1.1.7
- **Gradle**: 8.14.3
- **IDE**: IntelliJ IDEA 권장

#### **주요 라이브러리 버전**
```gradle
// Spring Framework

spring-boot-starter-data-jpa: 3.5.5
spring-boot-starter-data-redis: 3.5.5
spring-boot-starter-oauth2-client: 3.5.5
spring-boot-starter-security: 3.5.5
spring-boot-starter-validation: 3.5.5
spring-boot-starter-web: 3.5.5
spring-boot-starter-webflux: 3.5.5
spring-boot-starter-websocket: 3.5.5
spring-messaging: 3.5.5

// 보안
jjwt-api: 0.12.6
jjwt-impl: 0.12.6
jjwt-jackson:0.12.6

// 개발 도구
spring-boot-devtools: 3.5.5

// 데이터베이스
mysql-connector-j: 9.4.0
h2database: runtime (테스트용)
```

### **B. Frontend (Next.js)**

#### **개발 환경**
- **next.js**: node:18-alpine

#### **SDK 버전**
- **compileSdk**: 36
- **minSdk**: 33 (Android 13)
- **targetSdk**: 36

#### **주요 라이브러리 버전**
typescript

jenkins

docker

nginx

react query

### **C. AI Server (FastAPI)**

#### **Python 환경**
- **Python**: 3.10
- **FastAPI**: 0.115.4

#### **주요 라이브러리**
```python
# AI/ML
pytorch >= 2.5.1
numpy >= 2.2.6
pandas >= 2.3.2
graphSAGE
GNN explainer
```

## 1.2 빌드 및 실행 환경 변수

### **Frontend/Backend 환경 변수**

#### **필수 환경 변수**
```bash
# application.properties 파일에 설정
spring:
  datasource:
    spring.datasource.username: [SPRING_DATASOURCE_USERNAME]
    spring.datasource.password: [SPRING_DATASOURCE_PASSWORD]

jwt:
  jwt.secret: [JWT_SECRET]
```

#### **AI API 연동 설정**
```
python:
  api:
    ai.server.base-url: [AI_SERVER_BASE_URL]  # AI 서버 주소

#### **Kakao Maps API 키**
[KAKAO_MAP_KEY]

#### **GeoCoder API 키**
geocoder.token=[GEOCODER_TOKEN]

### **AI Server 환경 변수**

#### **.env 파일 생성 필요**
```
#직접 빌드 시 서버 루트 디렉토리에 .env 파일 생성
# === 기본 설정 ===

SPRING_PROFILES_ACTIVE=dev
APP_PORT=8080

# === 데이터베이스 설정 ===

MYSQL_ROOT_PASSWORD=ssafy
MYSQL_DATABASE=zara
MYSQL_USER=startup_dev
MYSQL_PASSWORD=devpass
SPRING_DATASOURCE_USERNAME=startup_dev
SPRING_DATASOURCE_PASSWORD=devpass
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/zara?serverTimezone=Asia/Seoul&characterEncoding=UTF-8

# === Redis 설정 ===

SPRING_DATA_REDIS_HOST=localhost
REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=
SPRING_DATA_REDIS_TIMEOUT=2000

# === JWT 설정 ===

JWT_SECRET=

# === OAuth 설정 ===

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"

# === 외부 API 설정 ===

KT_API_KEY=your-kt-api-key
PUBLIC_DATA_API_KEY=your-public-data-api-key

KAKAO_MAP_KEY=

# === 로깅 ===

LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_APP=DEBUG

# === Geo ===

GEOCODER_TOKEN=

# === AI GMS 설정 (새로 추가) ===
AI_SERVER_BASE_URL=http://ai:8000

AI_GMS_API_KEY=
AI_GMS_BASE_URL=https://gms.ssafy.io/gmsapi

# 필수
GMS_KEY=
GMS_BASE_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1

# 데이터/모델 파일이 있는 폴더 (스크린샷에 보인 파일들이 위치한 곳)
DATA_DIR=./data

# 파일명은 니가 가진 그대로 사용
MODEL_PATH=survival_gnn.pt
META_PATH=survival_meta.json

# 로깅
LOG_LEVEL=INFO

LLM_ENABLE=true
LLM_MODEL=gpt-5-nano
LLM_TIMEOUT=60
DATA_DIR=./data
```

## 1.3 빌드 및 배포
### **빌드 아키텍처**
- git clone 이후 .env파일 루트에 생성
- docker compose up --build를 통해 실행
- localhost:3000으로 접근

### **배포 아키텍처**

1. **개발자가 release 브랜치에 push**
2. 젠킨스가 git clone 워크스페이스에 복사
3. 젠킨스 파일을 읽고 credential 환경변수에 주입
4. 도커 컴포즈 빌드
5. 로드 실패시 과거 성공버전으로 배포


## 1.4 배포시 특이사항

nginx 컨테이너 jenkins 컨테이너 ec2에서 직접실행
docker run \
  -d \
  --name nginx \
  --network my-network \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /home/ubuntu/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:latest
  
docker run \
-d \
--name jenkins \
--network my-network \
--restart unless-stopped \
-v jenkins_home:/var/jenkins_home \
-v /var/run/docker.sock:/var/run/docker.sock \
-e JENKINS_OPTS="--prefix=/jenkins" \
--group-add $(stat -c '%g' /var/run/docker.sock) \
my-jenkins:latestdocker run \
  -d \
  --name jenkins \
  --network my-network \
  --restart unless-stopped \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  my-jenkins:latest

## 1.5 주요 설정 파일 목록

### **Backend**
- `backend/src/main/resources/application.properties` - 메인 설정
- `backend/build.gradle` - 의존성 및 빌드 설정

### **Frontend**
- `frontend/yarn.lock` - 라이브러리 버전 관리
- `frontend/package.json` - 앱 빌드 설정

.env