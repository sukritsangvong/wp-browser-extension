import psycopg2
import psycopg2.extras as extras
import pandas as pd
from io import StringIO
import numpy as np
from sqlalchemy import create_engine
import time
import configparser


#Test to see which extraction take the least time and development power
file = "data.tsv"
config = configparser.ConfigParser()
config.read('config')
connection = psycopg2.connect(
    host=config['config']['host'],
    database=config['config']['database'],
    user=config['config']['user'],
    password=config['config']['password'],
)
connection.autocommit = True


def execute_values(connection, file):
    df = pd.read_csv(file, quoting=3, header=None, delimiter='\t')
    print("Number of rows ", len(df.index))
    
    tpls = [tuple(x) for x in df.to_numpy()]
    cols = ','.join(list(df.columns))
    
    # SQL query to execute
    sql = "INSERT INTO click_count(%s) VALUES %%s" % (cols)
    cursor = connection.cursor()
    try:
        extras.execute_values(cursor, sql, tpls)
        print("Data inserted using execute_values() successfully..")
    except Exception as err:
        # pass exception to function
        print(err)
        cursor.close()
        
def copy_from(connection, file):
    f = open(file)
    cursor = connection.cursor()
    try:
        cursor.copy_from(f, 'click_count', sep="\t")
        print("Data inserted using copy_from_datafile() successfully....")
    except Exception as err:
        print(err)
        cursor.close()

def copy_from_stringIO(connection, file):
    buffer = StringIO()
    df = pd.read_csv(file, quoting=3, header=None, delimiter='\t', nrows=10000)
    df.to_csv(buffer, header=False, index = False)
    buffer.seek(0)
    cursor = connection.cursor()
    try:
        cursor.copy_from(buffer, 'click_count', sep="\t")
        print("Data inserted using copy_from_datafile() successfully....")
    except Exception as err:
        print(err)
        cursor.close()
        
connect_alchemy = "postgresql+psycopg2://%s:%s@%s/%s" % (
    config['config']['host'],
    config['config']['database'],
    config['config']['user'],
    config['config']['password']
)
def using_alchemy(connection, file):
    try:
        cursor = connection.cursor
        df = pd.read_csv(file, quoting=3, header=None, delimiter='\t', nrows=10000)
        engine = create_engine(connect_alchemy)
        df.to_sql('click_count', con=engine, index=False, if_exists='append',chunksize = 1000)
        print("Data inserted using to_sql()(sqlalchemy) done successfully...")
    except Exception as err:
        # passing exception to function
        print(err)
        
methods = [execute_values, copy_from, copy_from_stringIO]
for method in methods:
    start_time = time.time()
    method(connection, file)
    end_time = time.time()
    print(str(method), end_time-start_time)
    
start_time = time.time()
using_alchemy(connection, file)
end_time = time.time()
print("Using alchemy", end_time-start_time)