import os
import smtplib
import pandas as pd

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

CSV_FILE = '../data.csv'
TEXT_FILE = 'data.txt'
SUBJECT_FILE = 'subject.txt'
BODY_FILE = 'body.html'

# Load subject
if not os.path.exists(SUBJECT_FILE):
    print(f"{SUBJECT_FILE} not found!")
    exit(1)

with open(SUBJECT_FILE, "r", encoding="utf-8") as f:
    SUBJECT_TEMPLATE = f.read().strip()

# Load body
if not os.path.exists(BODY_FILE):
    print(f"{BODY_FILE} not found!")
    exit(1)

with open(BODY_FILE, "r", encoding="utf-8") as f:
    BODY_TEMPLATE = f.read()

# Load CSV
if not os.path.exists(CSV_FILE):
    print(f"{CSV_FILE} not found!")
    exit(1)

# Track sent emails
if not os.path.exists(TEXT_FILE):
    open(TEXT_FILE, 'w').close()

with open(TEXT_FILE, 'r') as f:
    sent = set(line.strip() for line in f if line.strip())

df = pd.read_csv(CSV_FILE, dtype=str)

EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = 587

count = 0

for _, row in df.iterrows():
    username = row["email"].strip()
    password = row["password"].strip()
    role = row.get("role", "").strip()

    key = username
    if key in sent:
        print(f"Skipping {username}")
        continue

    # Prepare email
    subject = SUBJECT_TEMPLATE
    body = BODY_TEMPLATE.replace("{{EMAIL}}", username)
    body = body.replace("{{PASSWORD}}", password)
    body = body.replace("{{ROLE}}", role)

    try:
        message = MIMEMultipart()
        message['From'] = EMAIL
        message['To'] = username
        message['Subject'] = subject
        message.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL, PASSWORD)
            server.send_message(message)

        print(f"Email sent to {username}")
        count += 1

        with open(TEXT_FILE, 'a') as f:
            f.write(key + '\n')

        sent.add(key)

    except Exception as e:
        print(f"Failed for {username}: {e}")

print(f"Total emails sent: {count}")