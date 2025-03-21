// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0

package database

import (
	"database/sql"
	"time"
)

type Trade struct {
	ID        int32
	UserID    int32
	OrderTime time.Time
	Symbol    string
	Price     string
	OrderType string
	CreatedAt sql.NullTime
	UpdatedAt sql.NullTime
}

type User struct {
	ID             int32
	Username       string
	HashedPassword string
	CreatedAt      sql.NullTime
	UpdatedAt      sql.NullTime
}
