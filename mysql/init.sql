-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS zara;
USE zara;

-- 외래 키 제약 조건 임시 비활성화
SET FOREIGN_KEY_CHECKS = 0;
SET unique_checks = 0;
SET autocommit = 0;

-- 1. user 테이블 생성 (존재하지 않으면)
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(255),
    oauth2_provider VARCHAR(255) NOT NULL,
    oauth2_provider_id VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. store 테이블 생성 (존재하지 않으면)
CREATE TABLE IF NOT EXISTS store (
    id BIGINT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    store_name VARCHAR(64),                    -- 53자 + 20% 여유분
    branch_name VARCHAR(12),                   -- 9자 + 30% 여유분
    biz_category_code CHAR(6),                 -- 문자1+숫자5 고정
    dong_code INT NOT NULL,                    -- 숫자이므로 INT
    road_address VARCHAR(32),                  -- 26자 + 20% 여유분
    lat DECIMAL(15,12) NOT NULL,
    lng DECIMAL(15,12) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. in_out 테이블 생성 (존재하지 않으면)
CREATE TABLE IF NOT EXISTS in_out (
    building_id BIGINT PRIMARY KEY,
    lat DECIMAL(15,12) NOT NULL,
    lng DECIMAL(15,12) NOT NULL,
    result JSON NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. login_search 테이블 생성 (존재하지 않으면)
CREATE TABLE IF NOT EXISTS login_search (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    building_id BIGINT NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,

    UNIQUE KEY unique_user_building (user_id, building_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES in_out(building_id) ON DELETE CASCADE,

    INDEX idx_user_favorite (user_id, favorite)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 권한 부여 (startup_dev 사용자에게 zara DB 접근 권한)
GRANT ALL PRIVILEGES ON zara.* TO 'startup_dev'@'%';
FLUSH PRIVILEGES;


-- LOCAL 키워드 제거
LOAD DATA INFILE '/var/lib/mysql-files/input_store.csv'
INTO TABLE store
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(store_name, branch_name, biz_category_code, dong_code, road_address, lat, lng);


COMMIT;
SET autocommit = 1;
SET unique_checks = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_location ON store (lat, lng);

-- 최종 최적화
OPTIMIZE TABLE store;
ANALYZE TABLE store;
