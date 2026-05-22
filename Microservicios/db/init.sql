-- ==========================================================
-- 1. CREACIÓN DE BASES DE DATOS
-- ==========================================================
CREATE DATABASE IF NOT EXISTS capasAlmacen;
CREATE DATABASE IF NOT EXISTS almacenServicios;
CREATE DATABASE IF NOT EXISTS almacenOrdenes;

-- ==========================================================
-- 2. ESQUEMA: USUARIOS (Agregando telefono y direccion)
-- ==========================================================
USE capasAlmacen;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  correo VARCHAR(120) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  direccion VARCHAR(150),
  edad INT,
  ciudad VARCHAR(100),
  rol ENUM('admin','cliente') DEFAULT 'cliente',
  password VARCHAR(255) NOT NULL
);
INSERT IGNORE INTO usuarios (nombres, apellidos, cedula, correo, telefono, direccion, rol, password)
VALUES ('Admin1', 'Sistema', '0000000000', 'admin@gmail.com', '0000000000', 'Sistema', 'admin', 'admin123');

-- ==========================================================
-- 3. ESQUEMA: SERVICIOS (Volviendo a 'servicio' singular y sus campos)
-- ==========================================================
USE almacenServicios;

CREATE TABLE IF NOT EXISTS servicio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60),
  precio DECIMAL(10,2),
  detalle VARCHAR(100),
  marca VARCHAR(30),
  estado ENUM('activo','inhabilitado','completado'),
  cupos INT DEFAULT 10
);

-- ==========================================================
-- 4. ESQUEMA: ÓRDENES (Como lo dejamos para que funcione el código)
-- ==========================================================
USE almacenOrdenes;

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombreCliente VARCHAR(50),
  emailCliente VARCHAR(50),
  precioTotal DECIMAL(10,2),
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  nombreServicio VARCHAR(50),
  estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente'
);
