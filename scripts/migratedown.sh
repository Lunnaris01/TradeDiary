#!/bin/bash

if [ -f .env ]; then

    set -a
    source .env
    set +a
fi

cd sql/schema
goose postgres "postgres://${PSQL_USER}:${PSQL_PW}@${PSQL_IP}:${PSQL_PORT}/${PSQL_DB}" down