import streamlit as st
import pandas as pd
import glob
import os
import altair as alt

# =========================================================================
# CONFIGURACIÓN PRINCIPAL
# =========================================================================

st.set_page_config(
    page_title="Dashboard Híbrido SPA Mascotas",
    layout="wide"
)

st.title("📊 Dashboard Big Data Híbrido - SPA Mascotas")
st.caption(
    "Arquitectura Swarm: Análisis Histórico (Batch Volumes) + Predicciones Inteligentes (MLlib)"
)
st.markdown("---")

# =========================================================================
# FUNCIÓN CARGAR DATOS DESDE VOLÚMENES COMPARTIDOS (SWARM)
# =========================================================================

def cargar_datos_locales(ruta_local):
    try:
        # Docker Swarm unifica los fragmentos creados por Spark en esta ruta compartida
        archivos = glob.glob(os.path.join(ruta_local, "part-*.json"))

        if not archivos:
            return pd.DataFrame()

        lista_df = []
        for archivo in archivos:
            # Validar que el archivo no esté vacío (mayor a 0 bytes)
            if os.path.exists(archivo) and os.path.getsize(archivo) > 0:
                df_temp = pd.read_json(archivo, lines=True)
                lista_df.append(df_temp)

        if lista_df:
            return pd.concat(lista_df, ignore_index=True)
        return pd.DataFrame()

    except Exception as e:
        st.error(f"Error leyendo volumen local en [{ruta_local}]: {e}")
        return pd.DataFrame()

# =========================================================================
# CARGA HISTÓRICA DESDE LOS VOLÚMENES MOUNTED DE SWARM
# =========================================================================

# Ajustamos las rutas para que coincidan exactamente con la raíz del volumen compartido
BASE_VOLUMEN = "/tmp/resultados"

df_meses = cargar_datos_locales(f"{BASE_VOLUMEN}/analisis_meses")
df_edad = cargar_datos_locales(f"{BASE_VOLUMEN}/compras_edad")
df_ciudad = cargar_datos_locales(f"{BASE_VOLUMEN}/productos_ciudad")

# =========================================================================
# VALIDACIÓN DATOS HISTÓRICOS
# =========================================================================

historico_listo = (
    not df_ciudad.empty and
    not df_edad.empty and
    not df_meses.empty
)

# =========================================================================
# INTERFAZ DE ESPERA SI NO HAY DATOS
# =========================================================================

if not historico_listo:
    st.info(
        "⏳ **Procesamiento de Big Data en marcha:** "
        "El clúster Spark en Swarm aún no ha generado resultados en el volumen compartido."
    )
    if st.button("🔄 Sincronizar y Recargar Dashboard", type="primary"):
        st.rerun()
    st.stop()

# =========================================================================
# KPIs PRINCIPALES
# =========================================================================

total_servicios_vendidos = int(df_ciudad["Cantidad_Compras"].sum())
total_recaudado_global = round(df_ciudad["Total_Ventas"].sum(), 2)
cantidad_ciudades = df_ciudad["ciudad"].nunique()

kpi1, kpi2, kpi3 = st.columns(3)
with kpi1:
    st.metric(
        label="📈 Total Servicios Históricos (Docker Swarm)",
        value=f"{total_servicios_vendidos:,}"
    )
with kpi2:
    st.metric(
        label="💰 Facturación Total Histórica",
        value=f"${total_recaudado_global:,.2f}"
    )
with kpi3:
    st.metric(
        label="🏢 Sedes / Ciudades Activas",
        value=cantidad_ciudades
    )

st.markdown("---")

# =========================================================================
# TABS DE VISUALIZACIÓN
# =========================================================================

tab_historico, tab_ml = st.tabs([
    "🏛️ Análisis Histórico (Batch)",
    "🤖 Predicciones Inteligentes (MLlib)"
])

# =========================================================================
# TAB HISTÓRICO
# =========================================================================
with tab_historico:
    st.header("🏢 Análisis de Mercado por Demografía y Ciudades (Shared Volume Source)")
    st.success("🎯 Datos históricos mapeados directamente desde la infraestructura distribuida")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📍 Ventas Totales por Ciudad")
        ventas_por_ciudad = df_ciudad.groupby("ciudad")["Total_Ventas"].sum().sort_values(ascending=False).reset_index()
        st.bar_chart(data=ventas_por_ciudad, x="ciudad", y="Total_Ventas", color="#1f77b4")

    with col2:
        st.subheader("🛍️ Productos más comprados por Ciudad")
        lista_ciudades = df_ciudad["ciudad"].unique()
        ciudad_sel = st.selectbox("Selecciona una ciudad:", lista_ciudades)
        df_ciudad_filtrado = df_ciudad[df_ciudad["ciudad"] == ciudad_sel].sort_values(by="Cantidad_Compras", ascending=False)
        st.bar_chart(data=df_ciudad_filtrado, x="nombreServicio", y="Cantidad_Compras", color="#ff7f0e")

    st.markdown("---")

    col3, col4 = st.columns([1, 2])

    with col3:
        st.subheader("💡 Rango de Edad que más Compra")
        total_por_edad = df_edad.groupby("rango_edad")["Cantidad_Compras"].sum().sort_values(ascending=False).reset_index()
        st.dataframe(total_por_edad, hide_index=True, use_container_width=True)

    with col4:
        st.subheader("🐕 Preferencia por Edad")
        lista_edades = df_edad["rango_edad"].unique()
        edad_sel = st.selectbox("Selecciona un rango de edad:", lista_edades)
        df_edad_filtrado = df_edad[df_edad["rango_edad"] == edad_sel].sort_values(by="Cantidad_Compras", ascending=False)
        st.bar_chart(data=df_edad_filtrado, x="nombreServicio", y="Cantidad_Compras", color="#2ca02c")

    st.markdown("---")
    st.header("📈 Evolución Temporal del Negocio (Tendencias por Mes)")

    orden_meses = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    }

    df_meses_ordenado = df_meses.copy()
    if "mes_nombre" in df_meses_ordenado.columns:
        df_meses_ordenado['orden'] = df_meses_ordenado['mes_nombre'].map(orden_meses)
        df_meses_ordenado = df_meses_ordenado.sort_values(by='orden').reset_index(drop=True)

    col_t1, col_t2 = st.columns(2)
    with col_t1:
        st.subheader("📊 Compras Totales por Mes")
        st.bar_chart(data=df_meses_ordenado, x="mes_nombre", y="Cantidad_Compras", color="#9467bd")

    with col_t2:
        st.subheader("💰 Total Recaudación por Mes")
        st.bar_chart(data=df_meses_ordenado, x="mes_nombre", y="Ventas_Totales", color="#d62728")

    # Insights automáticos
    if not df_meses_ordenado.empty:
        fila_max_freq = df_meses_ordenado.loc[df_meses_ordenado["Cantidad_Compras"].idxmax()]
        fila_max_ventas = df_meses_ordenado.loc[df_meses_ordenado["Ventas_Totales"].idxmax()]

        st.markdown("#### 💡 Insights y Conclusiones del Comportamiento Temporal:")
        inf1, inf2 = st.columns(2)
        with inf1:
            st.info(f"🔝 Mes con Mayor Frecuencia de Compras: **{fila_max_freq['mes_nombre']}** con {fila_max_freq['Cantidad_Compras']} transacciones.")
        with inf2:
            st.success(f"🔥 Mes con Mayor Recaudación: **{fila_max_ventas['mes_nombre']}** con ${fila_max_ventas['Ventas_Totales']:,.2f} COP.")

# =========================================================================
# TAB MACHINE LEARNING (MLlib integration)
# =========================================================================
with tab_ml:
    st.header("🤖 Predicción Inteligente de Ingresos")
    st.write("Modelo de Regresión Lineal entrenado dinámicamente en el clúster Spark Swarm.")

    # Apuntamos a la carpeta compartida de predicciones configurada en el volumen
    df_ml = cargar_datos_locales("/tmp/predicciones")

    if df_ml.empty:
        st.warning("⚠️ Aún no existen predicciones generadas en el volumen compartido por MLlib.")
    else:
        st.success("✅ Predicciones predictivas cargadas desde el volumen de Swarm")
        st.subheader("📈 Predicción Próximos 30 Días")

        df_ml["fecha_prediccion"] = pd.to_datetime(df_ml["fecha_prediccion"])

        grafica_ml = alt.Chart(df_ml).mark_line(
            point=True,
            strokeWidth=4,
            color="#e76f51"
        ).encode(
            x=alt.X("fecha_prediccion:T", title="Fecha de Proyección"),
            y=alt.Y("ingreso_estimado_COP:Q", title="Ingresos Estimados (COP)"),
            tooltip=[
                alt.Tooltip("fecha_prediccion:T", title="Fecha"),
                alt.Tooltip("ingreso_estimado_COP:Q", title="Ingreso Estimado", format="$,.2f")
            ]
        ).properties(height=400).interactive()

        st.altair_chart(grafica_ml, use_container_width=True)

        total_estimado = round(df_ml["ingreso_estimado_COP"].sum(), 2)
        promedio = round(df_ml["ingreso_estimado_COP"].mean(), 2)

        c1, c2 = st.columns(2)
        with c1:
            st.metric("💰 Ingreso Proyectado Próximos 30 Días", f"${total_estimado:,.0f} COP")
        with c2:
            st.metric("📊 Media de Facturación Diaria Prevista", f"${promedio:,.0f} COP")

        st.markdown("---")
        st.subheader("📋 Tabla Estructurada de Predicciones")
        st.dataframe(df_ml.sort_values(by="fecha_prediccion"), use_container_width=True, hide_index=True)

# =========================================================================
# FOOTER
# =========================================================================
st.markdown("---")
st.caption("Dashboard de Analítica de Mascotas • Docker Swarm Mode Clustered Engine")