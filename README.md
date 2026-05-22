# 🐾 SPA Mascotas — Sistema de Gestión con Big Data Analytics

Sistema distribuido de gestión de una SPA para mascotas, desplegado con Docker Swarm sobre Vagrant/VirtualBox. Integra microservicios Node.js, análisis de Big Data con Apache Spark y un dashboard interactivo con Streamlit.

---

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Despliegue](#instalación-y-despliegue)
- [URLs del Sistema](#urls-del-sistema)
- [Módulo de Microservicios](#módulo-de-microservicios)
- [Módulo Big Data Analytics](#módulo-big-data-analytics)
- [Credenciales](#credenciales)
- [Imágenes en DockerHub](#imágenes-en-dockerhub)
- [Guía de Reinicio](#guía-de-reinicio)

---

## 🏗️ Arquitectura

El sistema está compuesto por dos stacks de Docker Swarm ejecutándose sobre dos máquinas virtuales Ubuntu 22.04 administradas por Vagrant:

```
PC Host (Windows)
└── VirtualBox + Vagrant
    ├── servidorUbuntu1 (192.168.100.2) — Swarm Manager
    └── servidorUbuntu2 (192.168.100.3) — Swarm Worker
```

### Stack 1: `proyecto_final` — Aplicación Principal

```
HAProxy (puerto 5090)
    ├── /api/usuarios  → Microservicio Usuarios (3001)
    ├── /api/servicios → Microservicio Servicios (3000)
    ├── /api/ordenes   → Microservicio Ordenes (3003)
    └── /             → Frontend Apache+PHP (80)
                            ↓
                        MySQL (3307)
                    ┌───────────────────┐
                    │  capasAlmacen     │
                    │  almacenServicios │
                    │  almacenOrdenes   │
                    └───────────────────┘
```

### Stack 2: `spa_mascotas` — Módulo Big Data

```
datasets CSV
    ↓
HDFS (NameNode + DataNode)
    ↓
Spark Master + Worker
    ├── Batch Job     → Análisis histórico
    └── MLlib Job     → Predicciones ML
    ↓
Dashboard Streamlit (puerto 8501)
```

---

## ⚙️ Requisitos

- Windows 10/11
- [VirtualBox](https://www.virtualbox.org/) 6.x o superior
- [Vagrant](https://www.vagrantup.com/) 2.x o superior
- 8 GB RAM mínimo recomendado
- 30 GB de espacio en disco

---

## 📁 Estructura del Proyecto

```
/vagrant/
├── Vagrantfile                      ← Configuración de las VMs
│
├── Microservicios/                  ← Stack proyecto_final
│   ├── docker-compose.yml           ← Orquestación de servicios
│   ├── haproxy/
│   │   └── haproxy.cfg              ← Configuración del balanceador
│   └── db/
│       └── init.sql                 ← Script de inicialización de BDs
│
├── modulo_analitica/                ← Stack spa_mascotas
│   ├── docker-stack.yml             ← Orquestación Big Data
│   ├── batch/
│   │   └── analisis_mascotas.py     ← Job de análisis histórico
│   ├── mlib/
│   │   └── mllib_predict.py         ← Job de predicciones ML
│   ├── dashboard/
│   │   └── dashboard.py             ← Dashboard Streamlit
│   ├── dataset_reservas.csv         ← Datos de reservas
│   ├── dataset_usuarios.csv         ← Datos de usuarios
│   └── dataset_servicios.csv        ← Datos de servicios
│
└── capasFront/                      ← Frontend HTML
    ├── index.html                   ← Login
    ├── admin_gestion.html           ← Panel admin (link al dashboard)
    ├── ver_productos.html
    ├── ver_usuarios.html
    ├── ver_reservas.html
    └── confi.js                     ← Configuración de IPs y puertos
```

---

## 🚀 Instalación y Despliegue

### 1. Clonar o copiar el proyecto

Copia la carpeta del proyecto a tu PC y ábrela en CMD:

```bash
cd C:\ruta\al\proyecto
```

### 2. Levantar las máquinas virtuales

```bash
vagrant up
```

> ⏳ La primera vez tarda 10-20 minutos descargando los boxes de Ubuntu.

### 3. Conectarse a servidorUbuntu1

```bash
vagrant ssh servidorUbuntu1
```

### 4. Instalar Docker (solo la primera vez)

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl -y
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

### 5. Inicializar Docker Swarm (solo la primera vez)

En `servidorUbuntu1`:
```bash
sudo docker swarm init --advertise-addr 192.168.100.2
```

En `servidorUbuntu2` (con el token que generó el comando anterior):
```bash
sudo docker swarm join --token <TOKEN> 192.168.100.2:2377
```

### 6. Cargar imágenes del módulo analítico (solo la primera vez)

```bash
sudo docker load -i /vagrant/modulo_analitica/dashboard.tar
sudo docker load -i /vagrant/modulo_analitica/haproxy.tar
```

También en `servidorUbuntu2`:
```bash
sudo docker load -i /vagrant/modulo_analitica/dashboard.tar
sudo docker load -i /vagrant/modulo_analitica/haproxy.tar
```

### 7. Crear red overlay para analítica (solo la primera vez)

```bash
sudo docker network create --driver overlay --attachable mascotas-net
```

### 8. Desplegar los stacks

```bash
# Stack de microservicios
cd /vagrant/Microservicios
sudo docker stack deploy -c docker-compose.yml proyecto_final

# Stack de analítica
cd /vagrant/modulo_analitica
sudo docker stack deploy -c docker-stack.yml spa_mascotas
```

### 9. Verificar que todo está corriendo

```bash
sudo docker stack services proyecto_final
sudo docker stack services spa_mascotas
```

> Todos los servicios deben mostrar `1/1` en REPLICAS.

---

## 📊 Módulo Big Data Analytics

### Subir datasets a HDFS

```bash
NAME_NODE=$(sudo docker ps --format "{{.Names}}" | grep namenode)
sudo docker exec $NAME_NODE hdfs dfs -mkdir -p /tmp
sudo docker cp /vagrant/modulo_analitica/dataset_reservas.csv $NAME_NODE:/tmp/
sudo docker cp /vagrant/modulo_analitica/dataset_usuarios.csv $NAME_NODE:/tmp/
sudo docker cp /vagrant/modulo_analitica/dataset_servicios.csv $NAME_NODE:/tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_reservas.csv /tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_usuarios.csv /tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_servicios.csv /tmp/
```

### Ejecutar Batch Job (Análisis histórico)

```bash
SPARK=$(sudo docker ps | grep spark-master | awk '{print $1}')
sudo docker exec $SPARK mkdir -p /opt/proyecto/batch
sudo docker cp /vagrant/modulo_analitica/batch/analisis_mascotas.py $SPARK:/opt/proyecto/batch/analisis_mascotas.py
sudo docker exec $SPARK /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  /opt/proyecto/batch/analisis_mascotas.py
```

### Ejecutar MLlib Job (Predicciones)

```bash
sudo docker exec $SPARK mkdir -p /tmp/resultados/mlib
sudo docker cp /vagrant/modulo_analitica/mlib/mllib_predict.py $SPARK:/tmp/resultados/mlib/mllib_predict.py
sudo docker exec $SPARK /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  /tmp/resultados/mlib/mllib_predict.py
```

---

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|---|---|---|
| 🌐 App Principal | `http://192.168.100.2:5090` | Login y frontend |
| 📊 HAProxy Stats | `http://192.168.100.2:8404/haproxy?stats` | Estadísticas del balanceador |
| 📈 Dashboard Analytics | `http://192.168.100.2:8501` | Big Data Dashboard |
| ⚡ Spark Master UI | `http://192.168.100.2:8080` | Panel de Spark |

---

## 🔧 Módulo de Microservicios

### Microservicios

| Microservicio | Puerto | Base de Datos | Descripción |
|---|---|---|---|
| Usuarios | 3001 | capasAlmacen | Gestión de usuarios y autenticación |
| Servicios | 3000 | almacenServicios | Catálogo de servicios del SPA |
| Ordenes | 3003 | almacenOrdenes | Gestión de reservas y órdenes |

### Base de Datos MySQL

**Puerto:** 3307  
**Contraseña root:** `Titoelgato0809`

| Base de Datos | Tablas | Descripción |
|---|---|---|
| capasAlmacen | usuarios | Clientes y administradores |
| almacenServicios | servicio | Catálogo de servicios |
| almacenOrdenes | reservas | Historial de reservas |

### Escalabilidad

Para escalar los microservicios:

```bash
sudo docker service scale proyecto_final_usuarios=3
sudo docker service scale proyecto_final_servicios=3
sudo docker service scale proyecto_final_ordenes=3
```

---

## 👤 Credenciales

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@admin.com` | `admin123` |

---

## 🐳 Imágenes en DockerHub

| Imagen | Descripción |
|---|---|
| `juandevia06/usuarios` | Microservicio usuarios |
| `juandevia06/servicios` | Microservicio servicios |
| `juandevia06/ordenes` | Microservicio ordenes |
| `juandevia06/frontend-almacen` | Frontend con link al dashboard |
| `juandevia06/haproxy-almacen` | HAProxy con configuración de réplicas |
| `juandevia06/mysql-almacen` | MySQL con init.sql incluido |
| `titoelgato/micro-usuarios` | Microservicio usuarios (original) |
| `titoelgato/micro-servicios` | Microservicio servicios (original) |
| `titoelgato/micro-ordenes` | Microservicio ordenes (original) |

---

## 🔄 Guía de Reinicio

Cada vez que reinicies las VMs ejecuta esto en orden:

```bash
# 1. Conectarse
vagrant ssh servidorUbuntu1

# 2. Levantar stacks
cd /vagrant/Microservicios
sudo docker stack deploy -c docker-compose.yml proyecto_final

cd /vagrant/modulo_analitica
sudo docker stack deploy -c docker-stack.yml spa_mascotas

# 3. Verificar que todo está en 1/1
sudo docker stack services proyecto_final
sudo docker stack services spa_mascotas

# 4. Subir datasets a HDFS
NAME_NODE=$(sudo docker ps --format "{{.Names}}" | grep namenode)
sudo docker exec $NAME_NODE hdfs dfs -mkdir -p /tmp
sudo docker cp /vagrant/modulo_analitica/dataset_reservas.csv $NAME_NODE:/tmp/
sudo docker cp /vagrant/modulo_analitica/dataset_usuarios.csv $NAME_NODE:/tmp/
sudo docker cp /vagrant/modulo_analitica/dataset_servicios.csv $NAME_NODE:/tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_reservas.csv /tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_usuarios.csv /tmp/
sudo docker exec $NAME_NODE hdfs dfs -put -f /tmp/dataset_servicios.csv /tmp/

# 5. Ejecutar batch y MLlib
SPARK=$(sudo docker ps | grep spark-master | awk '{print $1}')
sudo docker exec $SPARK mkdir -p /opt/proyecto/batch
sudo docker cp /vagrant/modulo_analitica/batch/analisis_mascotas.py $SPARK:/opt/proyecto/batch/analisis_mascotas.py
sudo docker exec $SPARK /opt/spark/bin/spark-submit --master spark://spark-master:7077 /opt/proyecto/batch/analisis_mascotas.py

sudo docker exec $SPARK mkdir -p /tmp/resultados/mlib
sudo docker cp /vagrant/modulo_analitica/mlib/mllib_predict.py $SPARK:/tmp/resultados/mlib/mllib_predict.py
sudo docker exec $SPARK /opt/spark/bin/spark-submit --master spark://spark-master:7077 /tmp/resultados/mlib/mllib_predict.py
```

---

## 👥 Autores

- **Juan Devia** — `juandevia06` — Infraestructura Docker, Swarm, Frontend
- **Compañero** — `titoelgato` — Microservicios Node.js, Módulo Analytics

---

## 📚 Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Docker | 29.x | Contenedores |
| Docker Swarm | - | Orquestación |
| Vagrant | 2.x | VMs |
| VirtualBox | 6.x | Hypervisor |
| Node.js | 18 | Microservicios |
| Express | 4.x | API REST |
| MySQL | 8.0 | Base de datos |
| HAProxy | 3.x | Balanceador de carga |
| Apache Spark | 3.5.1 | Procesamiento distribuido |
| HDFS (Hadoop) | 3.2.1 | Almacenamiento distribuido |
| Streamlit | - | Dashboard |
| Python | 3.x | Scripts de análisis |
| PySpark MLlib | 3.5.1 | Machine Learning |
