DROP TABLE IF EXISTS tx;
CREATE TABLE tx (
    tx_id INT NOT NULL,
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    tx_date DATETIME NOT NULL,
    tx_value FLOAT NOT NULL,
    tx_type VARCHAR(255) NOT NULL,
    original_wording VARCHAR(255) NOT NULL,
    categorie_id VARCHAR(32) NULL DEFAULT NULL,
    pinned BOOL NOT NULL DEFAULT FALSE,

    PRIMARY KEY (`tx_id`),
    FOREIGN KEY (`account_id`) REFERENCES bankAccount(`account_id`)
);

CREATE INDEX idx_tx_categorie_id ON tx (categorie_id);