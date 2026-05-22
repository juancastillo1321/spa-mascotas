from pyspark.sql import SparkSession
from pyspark.sql.functions import split, col

# =========================================================
# 1. Crear sesión Spark
# =========================================================

spark = SparkSession.builder \
    .appName("StreamingReservasADashboard") \
    .master("spark://spark-master:7077") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

# =========================================================
# 2. Leer stream socket
# =========================================================

stream_lineas = spark.readStream \
    .format("socket") \
    .option("host", "socket-server") \
    .option("port", 9999) \
    .load()
# =========================================================
# 3. Transformar columnas
# =========================================================

reservas_stream_df = stream_lineas.select(
    split(col("value"), ",").getItem(0).alias("id"),
    split(col("value"), ",").getItem(1).alias("nombreCliente"),
    split(col("value"), ",").getItem(2).alias("emailCliente"),
    split(col("value"), ",").getItem(3).cast("int").alias("precioTotal"),
    split(col("value"), ",").getItem(4).alias("fecha"),
    split(col("value"), ",").getItem(5).alias("nombreServicio"),
    split(col("value"), ",").getItem(6).alias("estado"),
    split(col("value"), ",").getItem(7).alias("ciudad"),
    split(col("value"), ",").getItem(8).cast("int").alias("edad")
)

# =========================================================
# 4. DEBUG EN CONSOLA
# =========================================================

debug_query = reservas_stream_df.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

# =========================================================
# 5. Escribir streaming CSV en HDFS
# =========================================================

query = reservas_stream_df.writeStream \
    .outputMode("append") \
    .format("csv") \
    .option("path", "hdfs://namenode:9000/resultados_streaming") \
    .option("checkpointLocation", "hdfs://namenode:9000/checkpoints_streaming") \
    .trigger(processingTime="10 seconds") \
    .start()

print("⚡ Streaming iniciado correctamente")

query.awaitTermination()