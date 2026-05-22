from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    sum,
    count,
    month,
    date_format,
    when
)

# =====================================================
# SPARK SESSION
# =====================================================

spark = SparkSession.builder \
.appName("Analisis_SPA_Mascotas_BigData") \
    .master("spark://spark-master:7077") \
    .config("spark.hadoop.dfs.client.use.datanode.hostname", "true") \
    .config("spark.hadoop.dfs.datanode.use.hostname", "true") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

# =====================================================
# CARGA DESDE HDFS
# =====================================================

usuarios_df = spark.read.csv(
    "hdfs://namenode:9000/tmp/dataset_usuarios.csv",
    header=True,
    inferSchema=True
)

reservas_df = spark.read.csv(
    "hdfs://namenode:9000/tmp/dataset_reservas.csv",
    header=True,
    inferSchema=True
)

# =====================================================
# JOIN
# =====================================================

df_final = reservas_df.join(
    usuarios_df,
    reservas_df.emailCliente == usuarios_df.correo,
    "left"
)

df_final = df_final.fillna({
    "ciudad": "Sin Ciudad",
    "edad": 0
})

df_final = df_final.withColumn(
    "fecha_dt",
    col("fecha").cast("timestamp")
)

# =====================================================
# PRODUCTOS POR CIUDAD
# =====================================================

productos_por_ciudad = df_final.groupBy(
    "ciudad",
    "nombreServicio"
).agg(
    count(reservas_df.id).alias("Cantidad_Compras"),
    sum("precioTotal").alias("Total_Ventas")
)

# =====================================================
# RANGOS DE EDAD
# =====================================================

df_edades = df_final.withColumn(
    "rango_edad",
    when(col("edad") < 18, "Menores de 18")
    .when((col("edad") >= 18) & (col("edad") <= 25), "18-25")
    .when((col("edad") >= 26) & (col("edad") <= 35), "26-35")
    .when((col("edad") >= 36) & (col("edad") <= 50), "36-50")
    .otherwise("Mayores de 50")
)

compras_por_edad = df_edades.groupBy(
    "rango_edad",
    "nombreServicio"
).agg(
    count(reservas_df.id).alias("Cantidad_Compras")
)

# =====================================================
# ANALISIS POR MESES
# =====================================================

df_meses = df_final.withColumn(
    "mes_numero",
    month(col("fecha_dt"))
).withColumn(
    "mes_nombre",
    date_format(col("fecha_dt"), "MMMM")
)

analisis_meses = df_meses.groupBy(
    "mes_numero",
    "mes_nombre"
).agg(
    count(reservas_df.id).alias("Cantidad_Compras"),
    sum("precioTotal").alias("Ventas_Totales")
).orderBy("mes_numero")

# =====================================================
# CARGA DESDE HDFS (Asegúrate de que quede así)
# =====================================================

usuarios_df = spark.read.csv(
    "hdfs://namenode:9000/tmp/dataset_usuarios.csv",
    header=True,
    inferSchema=True
)

reservas_df = spark.read.csv(
    "hdfs://namenode:9000/tmp/dataset_reservas.csv",
    header=True,
    inferSchema=True
)

# ... (El resto del código del join, edades y meses se queda igual) ...

# =====================================================
# GUARDAR EN EL VOLUMEN LOCAL
# =====================================================
BASE = "file:///tmp/resultados"

analisis_meses.coalesce(1).write.mode("overwrite").json(f"{BASE}/analisis_meses")
compras_por_edad.coalesce(1).write.mode("overwrite").json(f"{BASE}/compras_edad")
productos_por_ciudad.coalesce(1).write.mode("overwrite").json(f"{BASE}/productos_ciudad")

print("\n🚀 BATCH FINALIZADO CORRECTAMENTE")
spark.stop()