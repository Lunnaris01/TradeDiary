-- +goose Up
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_time TIMESTAMP NOT NULL,
    symbol TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    order_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down
DROP TABLE trades;