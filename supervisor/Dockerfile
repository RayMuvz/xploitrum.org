FROM python:3.11-slim
WORKDIR /srv/supervisor
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:8000", "supervisor:app", "--workers", "2"]
