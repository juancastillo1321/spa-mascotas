FROM bde2020/spark-master:3.1.1-hadoop3.2

# Instalar dependencias del sistema para poder compilar en Alpine
RUN apk add --no-cache gcc musl-dev python3-dev

# Actualizar pip e instalar tus librerías de analítica
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install numpy==1.21.6 pandas==1.3.5
RUN python3 -m pip install streamlit==1.12.2