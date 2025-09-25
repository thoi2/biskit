// Jenkinsfile: CI/CD 작업 순서를 정의하는 설계도

pipeline {
    agent any

    // Jenkins Credentials에 등록한 비밀 정보들을 환경 변수로 가져옴
    // Jenkins 관리 > Credentials에서 ID를 맞춰주어야 함
    environment {
        SPRING_DATASOURCE_USERNAME = credentials('mysql-user')
        MYSQL_USER                 = credentials('mysql-user')
        SPRING_DATASOURCE_PASSWORD = credentials('mysql-password')
        MYSQL_PASSWORD             = credentials('mysql-password')
        MYSQL_DATABASE        = credentials('mysql-database')
        MYSQL_ROOT_PASSWORD   = credentials('mysql-root-password')
        REDIS_PORT            = credentials('redis-port')
        JWT_SECRET            = credentials('jwt-secret')
        GOOGLE_CLIENT_ID      = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET  = credentials('google-client-secret')
        GOOGLE_REDIRECT_URI   = credentials('google-redirect-uri')
        SPRING_PROFILES_ACTIVE= credentials('spring-profiles-active')
        KAKAO_MAP_KEY= credentials('kakao-map-key')
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                // 빌드를 시작하기 전에 워크스페이스를 깨끗하게 삭제
                cleanWs()
            }
        }
        // 1단계: 코드 가져오기
        stage('Checkout') {
            steps {
                // GitHub 저장소에서 최신 코드를 가져옴
                git branch: 'release', credentialsId: 'gitlab-access-token', url: 'https://lab.ssafy.com/s13-bigdata-recom-sub1/S13P21A101.git'
            }
        }

        stage('Prepare Files') {
            steps {
                echo "Setting correct permissions for mysql config..."
            }
        }

            // (★추가★) 디버깅을 위한 새로운 단계
        stage('Debug - Verify Files') {
            steps {
                sh '''
                    echo "--- [DEBUG] 현재 작업 폴더 위치 ---"
                    pwd
                    echo "--- [DEBUG] 전체 파일 목록 및 권한 확인 (재귀적으로) ---"
                    ls -laR
                    echo "--- [DEBUG] Jenkins가 사용하는 docker-compose.yml 내용 ---"
                    cat docker-compose.yml
                    echo "--- [DEBUG] Jenkins가 사용하는 custom.cnf 내용 ---"
                    cat ./mysql/conf/custom.cnf
                    echo "--- [DEBUG] Jenkins가 사용하는 init.sql 내용 ---"
                    cat ./mysql/init.sql
                    cat docker-compose.prod.yml
                    echo "--- [DEBUG] 디버깅 끝 ---"
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    echo "================= DEBUGGING STEP 1: Jenkins Shell ================="
                    echo "Jenkins Shell - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}"
                    echo "Jenkins Shell - GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI}"
                    echo "==================================================================="
                    
                    # --build-arg 옵션을 사용하여 Jenkins 변수를 Docker 빌드 인자로 전달
                    docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache \
                        --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
                        --build-arg NEXT_PUBLIC_GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI} \
                        --build-arg NEXT_PUBLIC_KAKAO_MAP_KEY=${KAKAO_MAP_KEY}
                '''
            }
        }

        // 3단계: 기존 컨테이너 정리
        stage('Cleanup') {
            steps {
                script {
                    echo "Stopping and removing old containers..."
                    // 기존에 실행 중인 컨테이너가 있다면 중지하고 삭제
                    // 오류가 발생해도 다음 단계로 진행하도록 설정 (|| true)
                    sh 'docker compose -f docker-compose.yml -f docker-compose.prod.yml down'
                    // 혹시 남아있을 수 있는 볼륨을 강제로 제거
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
                    sh 'docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans'
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
