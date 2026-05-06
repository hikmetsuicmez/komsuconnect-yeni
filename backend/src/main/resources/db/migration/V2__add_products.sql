CREATE TABLE IF NOT EXISTS products (
    id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    business_profile_id UUID           NOT NULL,
    name                VARCHAR(255)   NOT NULL,
    description         TEXT,
    price               NUMERIC(10, 2) NOT NULL,
    image_url           VARCHAR(500),
    available           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP      NOT NULL,
    updated_at          TIMESTAMP      NOT NULL,
    CONSTRAINT fk_product_business FOREIGN KEY (business_profile_id)
        REFERENCES business_profiles (id) ON DELETE CASCADE
);
