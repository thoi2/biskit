# BISKIT: 사업 시작 키트 (BUSINESS START KIT)

BISKIT은 창업가와 예비 사업자에게 데이터 기반 의사결정을 지원하기 위해 **AI 기반 사업 분석 및 추천 서비스**를 제공하도록 설계된 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Features)

- **AI 기반 상권 분석:** 선택한 지역에 대한 다양한 업종의 분석 정보와 생존율 예측을 제공합니다.
- **맞춤형 사업 추천:** 사용자의 선호도와 설문 결과를 바탕으로 맞춤형 사업 아이템을 추천합니다.
- **대화형 지도 인터페이스:** 사용자가 지도에서 위치를 선택하고 분석 결과를 즉시 확인할 수 있습니다.
- **사용자 인증:** Google OAuth2 및 **JWT** (액세스/리프레시 토큰)를 사용하여 안전한 로그인 및 세션 관리를 지원합니다.
- **실시간 채팅:** 실시간 채팅 기능이 통합되어 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

이 프로젝트는 Docker로 완벽하게 컨테이너화된 세 가지 주요 서비스로 구성된 **모노레포**입니다.

|      서비스      | 기술 스택                                                                                |
| :--------------: | :--------------------------------------------------------------------------------------- |
|  **프론트엔드**  | **Next.js**, **React**, **TypeScript (tsx)**, Tailwind CSS, **Zustand**, **React Query** |
|    **백엔드**    | **Spring Boot**, Java 21, Spring Security, JPA, JWT, WebSocket                           |
|      **AI**      | **FastAPI**, Python, PyTorch, Pandas, OpenAI                                             |
| **데이터베이스** | **MySQL**, **Redis**                                                                     |
|   **데브옵스**   | **Docker**, **Docker Compose**, **Jenkins**, Nginx                                       |

---

## 🚀 시작하기 (Getting Started)

전체 애플리케이션은 **Docker Compose**로 실행되도록 설계되었습니다.

### 필수 조건 (Prerequisites)

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 로컬 환경에서 실행하기 (Running Locally)

1.  **저장소 복제 및 이동:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```
2.  **환경 파일(`.env`) 생성:**
    루트 디렉토리에 `.env` 파일을 생성하고 필수 환경 변수를 설정합니다.
3.  **Docker Compose로 실행 (빌드 및 시작):**
    ```bash
    docker-compose up --build -d
    ```
4.  **애플리케이션 접속:**
    - 프론트엔드: `http://localhost:3000` (또는 매핑된 포트)

### 애플리케이션 중지하기

```bash
docker-compose down
```
