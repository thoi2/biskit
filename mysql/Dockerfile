# 공식 MySQL 8.0 이미지를 기반으로 시작
FROM mysql:8.0

# /var/lib/mysql-files 디렉토리 자체의 소유자를 mysql로 변경
# 이렇게 하면 이 디렉토리로 마운트되는 모든 파일에 대한 접근 권한 문제가 해결됩니다.
RUN chown mysql:mysql /var/lib/mysql-files
COPY init.sql /docker-entrypoint-initdb.d/
COPY input_store.csv /var/lib/mysql-files/input_store.csv

RUN chown mysql:mysql /var/lib/mysql-files
COPY init.sql /docker-entrypoint-initdb.d/
COPY categories.csv /var/lib/mysql-files/categories.csv

# 컨테이너 내에서 파일 소유권을 mysql 유저로 변경
# 이 명령어는 특히 중요합니다.
RUN chown mysql:mysql /var/lib/mysql-files/input_store.csv

RUN chown mysql:mysql /var/lib/mysql-files/categories.csv