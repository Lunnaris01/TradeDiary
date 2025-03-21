package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Lunnaris01/TradeDiary/internal/auth"
	"github.com/Lunnaris01/TradeDiary/internal/database"
)

func (cfg apiConfig) handlerLogin(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")
	user, err := cfg.db.GetUserByName(r.Context(), username)
	if err != nil {
		log.Printf("Unable to find User: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Unable to find User", err)
		//http.Error(w, err.Error(), http.StatusInternalServerError)
		cfg.displayFileserverContent(w, "/")
		return
	}

	if username == "admin" && cfg.platform == "dev" {
		log.Print("Bypassing login on dev platform for admin user")
	} else {

		log.Printf("Trying to log in User with ID %v", user.ID)
		err = auth.CheckPasswordHash(password, user.HashedPassword)
		if err != nil {
			log.Printf("Unable to authenticate User: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Unable to autenticate User", err)
			return
		}
	}
	accessToken, err := auth.MakeJWT(
		int(user.ID),
		cfg.secretKey,
		time.Hour*24,
	)
	if err != nil {
		log.Printf("Unable to authenticate User: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to create JWT", err)
		return
	}

	type response struct {
		User  database.User
		Token string
	}

	respondWithJSON(w, http.StatusOK, response{
		User: database.User{
			ID:       user.ID,
			Username: user.Username,
		},
		Token: accessToken,
	})

	//cfg.displayFileserverContent(w, "/login")

}

func (cfg apiConfig) handlerSignup(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	hashed_password, err := auth.HashPassword(password)
	if err != nil {
		log.Printf("Error hashin password: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := cfg.db.CreateUser(r.Context(), database.CreateUserParams{
		Username:       username,
		HashedPassword: hashed_password,
	})
	if err != nil {
		log.Printf("Error creating user: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Successfully added user %v", user.Username)
	respondWithJSON(w, 200, struct {
		Username string `json:"username"`
	}{username})
}
