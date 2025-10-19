FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install flask
EXPOSE 5000
ENV FLAG="XPLoitRUM{easy_flag_1234}"
CMD ["python", "app.py"]
