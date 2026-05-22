import socket
import threading

HOST = "0.0.0.0"
PORT = 9999

clientes = []

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server.setsockopt(
    socket.SOL_SOCKET,
    socket.SO_REUSEADDR,
    1
)

server.bind((HOST, PORT))

server.listen(5)

print(f"Servidor escuchando {HOST}:{PORT}")

def manejar_cliente(conn, addr):

    print(f"Nueva conexión: {addr}")

    clientes.append(conn)

    try:

        while True:

            data = conn.recv(1024)

            if not data:
                break

            mensaje = data.decode()

            print(mensaje.strip())

            # reenviar a todos
            for cliente in clientes:

                if cliente != conn:

                    try:
                        cliente.send(data)
                    except:
                        pass

    except Exception as e:

        print("Error:", e)

    finally:

        clientes.remove(conn)
        conn.close()

while True:

    conn, addr = server.accept()

    hilo = threading.Thread(
        target=manejar_cliente,
        args=(conn, addr)
    )

    hilo.start()