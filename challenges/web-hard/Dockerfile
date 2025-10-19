FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install flask
EXPOSE 5000
ENV FLAG="XPLoitRUM{hard_flag_0910}"
CMD ["python", "app.py"]
