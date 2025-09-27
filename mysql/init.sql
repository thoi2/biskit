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
    oauth2_provider_id VARCHAR(255) NOT NULL,

    -- 설문조사 및 업종 추천 관련 컬럼
    survey_completed_at DATETIME COMMENT '설문조사 완료 시간',
    industry_1st VARCHAR(10) COMMENT '1순위 업종코드',
    industry_2nd VARCHAR(10) COMMENT '2순위 업종코드',
    industry_3rd VARCHAR(10) COMMENT '3순위 업종코드'
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

-- building
CREATE TABLE IF NOT EXISTS building (
    building_id MEDIUMINT UNSIGNED AUTO_INCREMENT NOT NULL,
    adr_mng_no VARCHAR(26) NOT NULL,
    lat DECIMAL(15,12) NOT NULL,
    lng DECIMAL(15,12) NOT NULL,
    PRIMARY KEY (building_id),
    UNIQUE KEY uk_building_adr_mng_no (adr_mng_no),
    CHECK (lat BETWEEN -90.0 AND 90.0),
    CHECK (lng BETWEEN -180.0 AND 180.0),
    CHECK (CHAR_LENGTH(adr_mng_no) IN (25, 26))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- category
CREATE TABLE IF NOT EXISTS category (
    category_id SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uk_category_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- in_out (복합 PK: building_id + category_id)
CREATE TABLE IF NOT EXISTS in_out (
    building_id MEDIUMINT UNSIGNED NOT NULL,
    category_id SMALLINT  UNSIGNED NOT NULL,
    result JSON,
    frequency INTEGER NOT NULL DEFAULT 0,
    last_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (building_id, category_id),
    KEY idx_inout_category (category_id),
    KEY idx_inout_last_at (last_at),
    CONSTRAINT fk_inout_building
    FOREIGN KEY (building_id) REFERENCES building(building_id) ON DELETE CASCADE,
    CONSTRAINT fk_inout_category
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. login_search 테이블 생성 (존재하지 않으면)
CREATE TABLE IF NOT EXISTS login_search (
    user_id BIGINT NOT NULL,
    building_id MEDIUMINT UNSIGNED NOT NULL,
    favorite TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id, building_id),
    KEY idx_login_building (building_id),

    CONSTRAINT fk_login_user
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_login_building
        FOREIGN KEY (building_id) REFERENCES building(building_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS search_category (
   user_id BIGINT NOT NULL,
   building_id MEDIUMINT UNSIGNED NOT NULL,
   category_id SMALLINT UNSIGNED NOT NULL,

   PRIMARY KEY (user_id, building_id, category_id),
   KEY idx_sc_building (building_id),
   KEY idx_sc_category (category_id),

   CONSTRAINT fk_sc_login
       FOREIGN KEY (user_id, building_id) REFERENCES login_search(user_id, building_id) ON DELETE CASCADE,
   CONSTRAINT fk_sc_category
       FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
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

LOAD DATA INFILE '/var/lib/mysql-files/categories.csv'
INTO TABLE category
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(category_id, name);

COMMIT;
SET autocommit = 1;
SET unique_checks = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_location ON store (lat, lng);

-- 최종 최적화
OPTIMIZE TABLE store;
ANALYZE TABLE store;

-- DEBUG: Check if category data is loaded
SELECT 'Number of rows in category table:', COUNT(*) FROM category;
