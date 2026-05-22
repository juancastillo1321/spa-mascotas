FROM python:3.10-slim

WORKDIR /app

# =========================================
# Dependencias sistema
# =========================================
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# =========================================
# Copiar requirements
# =========================================
COPY requirements.txt .

# =========================================
# Instalar librerías Python
# =========================================
RUN pip install --no-cache-dir -r requirements.txt

# =========================================
# Copiar proyecto dashboard
# =========================================
COPY . .

# =========================================
# Puerto Streamlit
# =========================================
EXPOSE 8501

# =========================================
# Ejecutar Streamlit (Con su nombre original)
# =========================================
CMD ["streamlit", "run", "dashboard.py", "--server.address=0.0.0.0"]