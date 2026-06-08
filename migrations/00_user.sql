CREATE DATABASE IF NOT EXISTS openfina
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'openfina_user'@'localhost' IDENTIFIED BY '1234';
CREATE USER IF NOT EXISTS 'openfina_user'@'127.0.0.1' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON openfina.* TO 'openfina_user'@'localhost';
GRANT ALL PRIVILEGES ON openfina.* TO 'openfina_user'@'127.0.0.1';

FLUSH PRIVILEGES;
