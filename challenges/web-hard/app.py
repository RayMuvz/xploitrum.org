from flask import Flask
app = Flask(__name__)
@app.route("/")
def index():
    with open("flag.txt") as f:
        flag = f.read().strip()
    return f"<h1>Web Hard</h1><p>Flag: <code>{flag}</code></p>"
