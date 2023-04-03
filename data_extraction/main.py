import os
import requests
from fastapi import FastAPI, Form
from typing import Optional
from pydantic import BaseModel
import gzip
import shutil
import psycopg2.extras
import configparser
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Link(BaseModel):
    url: str
    name: str
    
config = configparser.ConfigParser()
config.read('config')
connection = psycopg2.connect(
    host=config['config']['host'],
    database=config['config']['database'],
    user=config['config']['user'],
    password=config['config']['password'],
)
connection.autocommit = True

@app.get("/")
async def get():
    return {'response': 'This is click stream API'}

@app.get("/click_to_title/{title}/{count}")
def get_most_end_link(title: str, count: int):
    cursor = connection.cursor()
    sql_query = "SELECT end_page, count FROM click_count WHERE start_page='%s' ORDER BY Count DESC LIMIT %d;" % (title, count)
    print(sql_query)
    try:
        cursor.execute(sql_query)
        result = cursor.fetchall()
        return {"most_end": result}
    except Exception as e:
        cursor.close()
        return {"most_end": e}
    
@app.get("/click_from_title/{title}/{count}")
def get_most_start_link(title: str, count: int):
    cursor = connection.cursor()
    sql_query = "SELECT start_page, count FROM click_count WHERE end_page='%s' ORDER BY Count DESC LIMIT %d;" % (title, count)
    try:
        cursor.execute(sql_query)
        result = cursor.fetchall()
        return {"most_start": result}
    except Exception as e:
        cursor.close()
        return {"most_start": e}

@app.get("/click_to_title_internal/{title}/{count}")
def get_most_end_link_internal(title: str, count: int):
    cursor = connection.cursor()
    sql_query = "SELECT end_page, count FROM click_count WHERE start_page='%s' AND type='link' ORDER BY Count DESC LIMIT %d;" % (title, count)
    try:
        cursor.execute(sql_query)
        result = cursor.fetchall()
        return {"most_end": result}
    except Exception as e:
        cursor.close()
        return {"most_end": e}

@app.get("/click_from_title_internal/{title}/{count}")
def get_most_start_link_internal(title: str, count: int):
    cursor = connection.cursor()
    sql_query = "SELECT start_page, count FROM click_count WHERE end_page='%s'AND type='link' ORDER BY Count DESC LIMIT %d;"  % (title, count)
    try:
        cursor.execute(sql_query)
        result = cursor.fetchall()
        return {"most_start": result}
    except Exception as e:
        cursor.close()
        return {"most_start": e}