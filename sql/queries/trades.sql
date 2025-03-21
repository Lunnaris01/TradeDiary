-- name: CreateTrade :one
INSERT INTO trades (user_id, order_time, symbol, price, order_type)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;
-- name: GetUserTrades :many
SELECT * FROM trades WHERE user_id = $1 ORDER BY order_time;
