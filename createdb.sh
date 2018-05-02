#!/bin/sh

# Stats module
sqlite3 magicmatrix.sqlite "CREATE TABLE qc_runs ( run_id INTEGER PRIMARY KEY, player VARCHAR(100), wins INT(1), run_date INT(8) );"
sqlite3 magicmatrix.sqlite "CREATE TABLE draft_runs ( run_id INTEGER PRIMARY KEY, player VARCHAR(100), wins INT(1), run_date INT(8) );"