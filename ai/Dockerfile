# 1. 베이스 이미지 설정
FROM python:3.10-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
# requirements.txt를 먼저 복사하여 Docker 빌드 캐시를 활용합니다.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 소스 코드 및 데이터 복사
# 나머지 소스 코드와 데이터를 이미지에 복사합니다.
COPY ./app ./app

# 5. 포트 노출
# FastAPI 기본 포트인 8000번을 노출합니다.
EXPOSE 8000

# 6. 애플리케이션 실행
# 컨테이너가 시작될 때 uvicorn 서버를 실행합니다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
