package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/Lunnaris01/TradeDiary/internal/auth"
	"github.com/Lunnaris01/TradeDiary/internal/database"
)

type reqBody struct {
	WKN       string  `json:"wkn"`
	Price     float64 `json:"price"`
	OrderType string  `json:"order_type"`
	OrderTime string  `json:"order_time"`
}

func (cfg apiConfig) handlerDashboard(w http.ResponseWriter, r *http.Request) {
	cfg.displayFileserverContent(w, "/content")
}

func (cfg apiConfig) handlerGetTrades(w http.ResponseWriter, r *http.Request) {

	type JsonTrade struct {
		ID         int32     `json:"id"`
		Symbol     string    `json:"symbol"`
		Price      float64   `json:"price"`
		Order_type string    `json:"order_type"`
		Order_time time.Time `json:"order_time"`
	}

	log.Print("Attempting to add Get User Trades")
	bearerToken, err := auth.GetBearerToken(r.Header)

	if err != nil {
		log.Printf("Unable to read Authentification header")
		respondWithError(w, http.StatusUnauthorized, "Unable to read Authentification header", err)
		return
	}

	userIDStr, err := auth.ValidateJWT(bearerToken, cfg.secretKey)
	if err != nil {
		log.Printf("Token missmatch")
		respondWithError(w, http.StatusUnauthorized, "Unable to verify token", err)
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Printf("UserId not a valid Int")
		respondWithError(w, http.StatusUnauthorized, "Unable to verify user", err)
		return
	}

	trades, err := cfg.db.GetUserTrades(r.Context(), int32(userID))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Failes to load trades", err)
	}
	log.Printf("Authentification successfull for user: %v with token %v", userID, bearerToken)

	jsonTrades := make([]JsonTrade, len(trades))

	for i := range jsonTrades {
		price, err := strconv.ParseFloat(trades[i].Price, 64)
		if err != nil {
			log.Print("Failed to parse Price, corrupted database entry!")
			respondWithError(w, http.StatusInternalServerError, "Failes to load trades", err)
			return
		}
		jsonTrades[i] = JsonTrade{
			ID:         trades[i].ID,
			Symbol:     trades[i].Symbol,
			Price:      price,
			Order_type: trades[i].OrderType,
			Order_time: trades[i].OrderTime,
		}
	}

	respondWithJSON(w, http.StatusOK, jsonTrades)

}

func (cfg apiConfig) handlerAddTrade(w http.ResponseWriter, r *http.Request) {

	type JsonTrade struct {
		Symbol     string  `json:"symbol"`
		Price      float32 `json:"price"`
		Order_type string  `json:"order_type"`
		Order_time string  `json:"order_time"`
	}

	log.Print("Attempting to add new Trade")
	bearerToken, err := auth.GetBearerToken(r.Header)

	if err != nil {
		log.Printf("Unable to read Authentification header")
		respondWithError(w, http.StatusUnauthorized, "Unable to read Authentification header", err)
		return
	}
	var userIDstr string
	userIDstr, err = auth.ValidateJWT(bearerToken, cfg.secretKey)
	if err != nil {
		log.Printf("Token missmatch")
		respondWithError(w, http.StatusUnauthorized, "Unable to verify", err)
		return
	}

	userID, err := strconv.Atoi(userIDstr)
	if err != nil {
		log.Printf("Unable to convert UserID to Int")
		respondWithError(w, http.StatusBadRequest, "Unable to verify", err)
		return
	}
	log.Printf("Autheticated User with IDString: %v and ID: %v", userIDstr, userID)

	rBody := JsonTrade{}
	rData, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Failed to read Body")
		respondWithError(w, http.StatusBadRequest, "Error adding the trade", err)
		return
	}
	defer r.Body.Close()

	err = json.Unmarshal(rData, &rBody)
	if err != nil {
		log.Printf("Failed to Unmarshal JSON")
		respondWithError(w, http.StatusBadRequest, "Error adding the trade", err)
		return
	}

	layout := "2006-01-02 15:04"
	log.Printf("%v,%v", rBody.Order_type, rBody.Order_time)
	parsedTime, err := time.Parse(layout, rBody.Order_time)
	if err != nil {
		log.Printf("Failed to Parse Time")
		respondWithError(w, http.StatusBadRequest, "Error adding the trade", err)
		return
	}
	trade, err := cfg.db.CreateTrade(r.Context(), database.CreateTradeParams{
		UserID:    int32(userID),
		OrderTime: parsedTime,
		Symbol:    rBody.Symbol,
		Price:     fmt.Sprintf("%2f", rBody.Price),
		OrderType: rBody.Order_type,
	})
	if err != nil {
		log.Printf("Failed to create Trade with %v", err)
		respondWithError(w, http.StatusBadRequest, "Error adding the game", err)
		return
	}

	log.Printf("Added Trade to the Database! %v", trade)
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Added Successful"))

}

func (cfg apiConfig) handlerCloseTrade(w http.ResponseWriter, r *http.Request) {

}
