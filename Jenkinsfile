// Jenkinsfile: CI/CD 작업 순서를 정의하는 설계도

pipeline {
    agent any

    // Jenkins Credentials에 등록한 비밀 정보들을 환경 변수로 가져옴
    // Jenkins 관리 > Credentials에서 ID를 맞춰주어야 함
    environment {
        // docker-compose.yml에 정의된 변수들을 모두 이곳에 등록합니다.
        MYSQL_DATABASE           = credentials('mysql-database')
        SPRING_DATASOURCE_USERNAME = credentials('spring-datasource-username')
        SPRING_DATASOURCE_PASSWORD = credentials('spring-datasource-password')
        REDIS_PORT               = credentials('redis-port')
        JWT_SECRET               = credentials('jwt-secret')
        GOOGLE_CLIENT_ID         = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET     = credentials('google-client-secret')
        GOOGLE_REDIRECT_URI      = credentials('google-redirect-uri')
        KT_API_KEY               = credentials('kt-api-key')
        PUBLIC_DATA_API_KEY      = credentials('public-data-api-key')
        SPRING_PROFILES_ACTIVE   = credentials('spring-profiles-active')
        MYSQL_ROOT_PASSWORD      = credentials('mysql-root-password')
        MYSQL_USER               = credentials('mysql-user')
        MYSQL_PASSWORD           = credentials('mysql-password')
    }

    stages {
        // 1단계: 코드 가져오기
        stage('Checkout') {
            steps {
                // GitHub 저장소에서 최신 코드를 가져옴
                git branch: 'release', credentialsId: 'gitlab-access-token', url: 'https://lab.ssafy.com/s13-bigdata-recom-sub1/S13P21A101.git'
            }
        }

        // 2단계: Docker 이미지 빌드
        stage('Build') {
            steps {
                // (★수정★) 불필요한 script 블록을 제거하여 구조를 단순화합니다.
                echo "Starting Docker image build..."
                sh 'docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache'
                echo "Build completed."
            }
        }

        // 3단계: 기존 컨테이너 정리
        stage('Cleanup') {
            steps {
                script {
                    echo "Stopping and removing old containers..."
                    // 기존에 실행 중인 컨테이너가 있다면 중지하고 삭제
                    // 오류가 발생해도 다음 단계로 진행하도록 설정 (|| true)
                    sh 'docker compose -f docker-compose.yml -f docker-compose.prod.yml down || true'
                    echo "Cleanup completed."
                }
            }
        }

        // 4단계: 배포
        stage('Deploy') {
            steps {
                script {
                    echo "Deploying new containers..."
                    // 새로운 컨테이너를 백그라운드에서 실행
                    // environment 블록의 변수들이 컨테이너로 주입됨
                    sh 'docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d'
                    echo "Deployment completed successfully!"
                }
            }
        }

        // 5단계: 사용하지 않는 Docker 이미지 정리
        stage('Prune Docker Images') {
            steps {
                // 빌드 과정에서 생성된 중간 이미지나 이전 버전의 이미지를 삭제하여 서버 용량 확보
                sh 'docker image prune -f'
            }
        }
    }
}
