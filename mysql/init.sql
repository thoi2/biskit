-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS zara;
USE zara;

-- 외래 키 제약 조건 임시 비활성화
SET FOREIGN_KEY_CHECKS = 0;
SET unique_checks = 0;
SET autocommit = 0;

-- 기존 테이블 삭제 (필요한 것만)
DROP TABLE IF EXISTS login_search;
DROP TABLE IF EXISTS in_out;
DROP TABLE IF EXISTS store;
DROP TABLE IF EXISTS user;

-- 1. user 테이블 생성
CREATE TABLE user (
                      id INTEGER PRIMARY KEY AUTO_INCREMENT,
                      provider_user_id VARCHAR(255) UNIQUE,
                      email VARCHAR(255) NOT NULL,
                      nickname VARCHAR(255) NOT NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. store 테이블 생성
CREATE TABLE store (
                       id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
                       store_name VARCHAR(64),                    -- 53자 + 20% 여유분
                       branch_name VARCHAR(12),                   -- 9자 + 30% 여유분
                       biz_category_code CHAR(6),                 -- 문자1+숫자5 고정
                       dong_code INT NOT NULL,                    -- 숫자이므로 INT
                       road_address VARCHAR(32),                  -- 26자 + 20% 여유분
                       lat DECIMAL(15,12) NOT NULL,
                       lng DECIMAL(15,12) NOT NULL,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. in_out 테이블 생성
CREATE TABLE in_out (
                        building_id INTEGER PRIMARY KEY,
                        lat DECIMAL(15,12) NOT NULL,
                        lng DECIMAL(15,12) NOT NULL,
                        result JSON NOT NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. login_search 테이블 생성
CREATE TABLE login_search (
                              id INTEGER PRIMARY KEY AUTO_INCREMENT,
                              user_id INTEGER NOT NULL,
                              building_id INTEGER NOT NULL,
                              favorite BOOLEAN DEFAULT FALSE,

                              UNIQUE KEY unique_user_building (user_id, building_id),
                              FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
                              FOREIGN KEY (building_id) REFERENCES in_out(building_id) ON DELETE CASCADE,

                              INDEX idx_user_favorite (user_id, favorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LOCAL 옵션 활성화
SET GLOBAL local_infile = 'ON';

-- 데이터 로드 (CSV 파일 수정 없이!)
LOAD DATA LOCAL INFILE './store_data.csv'
INTO TABLE store
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES  -- ✅ 첫 번째 줄(헤더) 무시!
(store_name, branch_name, biz_category_code, dong_code, road_address, lng, lat);

COMMIT;
SET autocommit = 1;
SET unique_checks = 1;


-- 외래 키 제약 조건 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_location ON store (lat, lng);


-- 최종 최적화
OPTIMIZE TABLE store;
ANALYZE TABLE store;
