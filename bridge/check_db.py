import pyodbc
import sys

db_path = r"C:\Users\User\Downloads\DATA SURAT MASUK BIRO REKTOR 2026.accdb"
conn_str = r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=" + db_path + ";ReadOnly=1;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    tables = [table.table_name for table in cursor.tables(tableType='TABLE')]
    print("TABLES FOUND:")
    for t in tables:
        print(f"- {t}")
except Exception as e:
    print(f"ERROR: {e}")
