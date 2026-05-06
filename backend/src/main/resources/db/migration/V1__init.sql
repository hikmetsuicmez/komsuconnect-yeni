CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    full_name   VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP     NOT NULL
);

CREATE TABLE IF NOT EXISTS business_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID          NOT NULL UNIQUE,
    business_name VARCHAR(255)  NOT NULL,
    description   TEXT,
    address       VARCHAR(500),
    city          VARCHAR(100),
    phone         VARCHAR(20),
    created_at    TIMESTAMP     NOT NULL,
    updated_at    TIMESTAMP     NOT NULL,
    CONSTRAINT fk_business_user FOREIGN KEY (user_id) REFERENCES users (id)
);
