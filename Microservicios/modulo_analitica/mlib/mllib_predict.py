from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.ml.regression import LinearRegression
from pyspark.sql.functions import (
    col,
    unix_timestamp,
    from_unixtime,
    round
)
from datetime import datetime, timedelta

# =========================================================
# SPARK SESSION (Configurada para red multinodo Docker)
# =========================================================
spark = SparkSession.builder \
    .appName("AnaliticaHuellasML") \
    .master("spark://spark-master:7077") \
    .config("spark.hadoop.dfs.client.use.datanode.hostname", "true") \
    .config("spark.hadoop.dfs.datanode.use.hostname", "true") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

# =========================================================
# 1. Cargar dataset desde HDFS (Ruta absoluta del NameNode)
# =========================================================
df = spark.read.csv(
    "hdfs://namenode:9000/tmp/dataset_reservas.csv",
    header=True,
    inferSchema=True
)

# =========================================================
# 2. Preparar datos
# =========================================================
df = df.withColumn(
    "fecha_num",
    unix_timestamp(df["fecha"])
)

df = df.withColumn(
    "precioTotal",
    df["precioTotal"].cast("double")
).dropna()

# =========================================================
# 3. Entrenar modelo
# =========================================================
assembler = VectorAssembler(
    inputCols=["fecha_num"],
    outputCol="features"
)

data_prepped = assembler.transform(df)

lr = LinearRegression(
    featuresCol='features',
    labelCol='precioTotal'
)

model = lr.fit(data_prepped)

# =========================================================
# 4. Generar próximos 30 días
# =========================================================
last_date_val = df.agg({"fecha_num": "max"}).collect()[0][0]

future_dates = []
for i in range(1, 31):
    future_dates.append(
        (last_date_val + (86400 * i),)
    )

future_df = spark.createDataFrame(future_dates, ["fecha_num"])
future_prepped = assembler.transform(future_df)
predictions = model.transform(future_prepped)

# =========================================================
# 5. Resultado final
# =========================================================
final_result = predictions \
    .withColumn(
        "fecha_prediccion",
        from_unixtime("fecha_num")
    ) \
    .withColumn(
        "ingreso_estimado_COP",
        round(predictions["prediction"], 2)
    ) \
    .select(
        "fecha_prediccion",
        "ingreso_estimado_COP"
    )

# =========================================================
# EVALUAR MODELO
# =========================================================
predicciones_entrenamiento = model.transform(data_prepped)

evaluator = RegressionEvaluator(
    labelCol="precioTotal",
    predictionCol="prediction",
    metricName="rmse"
)

rmse = evaluator.evaluate(predicciones_entrenamiento)
promedio = df.selectExpr("avg(precioTotal)").collect()[0][0]
porcentaje_error = (rmse / promedio) * 100

print("\n==============================")
print("📊 MÉTRICAS DEL MODELO ML")
print("==============================")
print(f"RMSE: {rmse:.2f}")
print(f"Error porcentual aproximado: {porcentaje_error:.2f}%")
print("==============================\n")

# =========================================================
# 6. Guardar resultados DIRECTAMENTE EN HDFS
# =========================================================
output_path = "hdfs://namenode:9000/analitica_mascotas/predicciones_ml"

final_result.write \
    .mode("overwrite") \
    .json(output_path)

print("✅ Predicciones ML generadas y persistidas en HDFS correctamente")

spark.stop()