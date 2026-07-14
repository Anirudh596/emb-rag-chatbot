import os
import csv
import sqlite3

def main():
    # Define file paths relative to this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, 'app', 'data', 'docs', 'orders.csv')
    db_path = os.path.join(current_dir, 'app', 'data', 'orders.db')

    print(f"Reading CSV from: {csv_path}")
    print(f"Writing DB to: {db_path}")

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop table if it exists to ensure a clean import
    cursor.execute("DROP TABLE IF EXISTS orders;")

    # Create table with correct types
    # order_id (TEXT, PRIMARY KEY), customer (TEXT), product (TEXT), amount (INTEGER), status (TEXT), order_date (TEXT)
    cursor.execute("""
        CREATE TABLE orders (
            order_id TEXT PRIMARY KEY,
            customer TEXT,
            product TEXT,
            amount INTEGER,
            status TEXT,
            order_date TEXT
        );
    """)

    # Read CSV and insert into database
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header row
        
        # Verify headers match expected columns
        expected_headers = ['order_id', 'customer', 'product', 'amount', 'status', 'order_date']
        if header != expected_headers:
            print(f"Warning: CSV headers {header} do not match expected {expected_headers}")

        rows = []
        for row in reader:
            if not row:
                continue
            # Parse amount to integer (assuming it is integer in CSV)
            order_id, customer, product, amount_str, status, order_date = row
            try:
                amount = int(amount_str)
            except ValueError:
                try:
                    amount = float(amount_str)
                except ValueError:
                    amount = amount_str
            
            rows.append((order_id, customer, product, amount, status, order_date))

        # Insert rows using INSERT OR REPLACE (or INSERT)
        cursor.executemany("""
            INSERT OR REPLACE INTO orders (order_id, customer, product, amount, status, order_date)
            VALUES (?, ?, ?, ?, ?, ?);
        """, rows)

    conn.commit()
    print(f"Successfully imported {len(rows)} orders into 'orders' table in database.")

    # Verify import by reading count
    cursor.execute("SELECT COUNT(*) FROM orders;")
    count = cursor.fetchone()[0]
    print(f"Total rows in 'orders' table: {count}")

    # Show a few sample rows
    cursor.execute("SELECT * FROM orders LIMIT 3;")
    samples = cursor.fetchall()
    print("Sample rows:")
    for sample in samples:
        print(sample)

    conn.close()

if __name__ == '__main__':
    main()
