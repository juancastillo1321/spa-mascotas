FROM apache/spark:3.5.1

USER root

RUN pip install numpy pandas

WORKDIR /opt/proyecto/mlib