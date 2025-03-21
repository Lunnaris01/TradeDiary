-- name: CreateTrade :one
INSERT INTO trades (user_id, order_time, symbol, open_price, order_type)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;

-- name: CloseTrade :one
UPDATE trades SET close_price = $2 WHERE id = $1; 


-- name: GetUserTrades :many
SELECT * FROM trades WHERE user_id = $1 ORDER BY order_time DESC;
