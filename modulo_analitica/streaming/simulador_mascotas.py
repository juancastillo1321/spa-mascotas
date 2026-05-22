import socket
import time
import random
from datetime import datetime

HOST = "socket-server"
PORT = 9999

servicios = [
    ("Spa Relajante", 80000),
    ("Vacuna Rabia", 25000),
    ("Baño y Corte", 45000),
    ("Corte de Uñas", 15000)
]

ciudades = ["Cali", "Bogotá", "Medellín", "Palmira", "Buga"]

nombres = ["Carlos", "Ana", "Luis", "Maria", "Diego", "Paula"]

print("🚀 Simulador automático iniciado...")

while True:
    try:
        cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        cliente.connect((HOST, PORT))

        while True:
            servicio, precio = random.choice(servicios)
            nombre = random.choice(nombres)
            ciudad = random.choice(ciudades)
            edad = random.randint(18, 70)

            evento = (
                f"{random.randint(1,9999)},"
                f"{nombre},"
                f"{nombre.lower()}@mail.com,"
                f"{precio},"
                f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')},"
                f"{servicio},"
                f"pagado,"
                f"{ciudad},"
                f"{edad}"
            )

            cliente.send((evento + "\n").encode("utf-8"))

            print("📤 Evento enviado:", evento)

            time.sleep(2)

    except Exception as e:
        print("⚠️ Error conectando:", e)
        time.sleep(5)