#!/bin/bash

echo "🔍 Diagnóstico de conexión a PostgreSQL"
echo "========================================"

# Test 1: Verificar que las variables están cargadas
echo ""
echo "📋 Test 1: Variables de entorno"
echo "POSTGRES_HOST: $POSTGRES_HOST"
echo "POSTGRES_PORT: $POSTGRES_PORT"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DATABASE: $POSTGRES_DATABASE"
echo "DB_SSLMODE: $DB_SSLMODE"

# Test 2: Verificar conectividad de red (ping/telnet)
echo ""
echo "🌐 Test 2: Conectividad de red al host"
if command -v nc &> /dev/null; then
    nc -zv $POSTGRES_HOST $POSTGRES_PORT 2>&1
else
    echo "⚠️  netcat no disponible, instalando..."
    apk add --no-cache netcat-openbsd
    nc -zv $POSTGRES_HOST $POSTGRES_PORT 2>&1
fi

# Test 3: Resolver DNS
echo ""
echo "🔎 Test 3: Resolución DNS"
nslookup $POSTGRES_HOST || echo "⚠️  nslookup no disponible"

# Test 4: Intentar conexión con psql
echo ""
echo "🔌 Test 4: Conexión directa con psql"
if command -v psql &> /dev/null; then
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DATABASE -c "SELECT version();" 2>&1
else
    echo "⚠️  psql no disponible, instalando..."
    apk add --no-cache postgresql-client
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DATABASE -c "SELECT version();" 2>&1
fi

echo ""
echo "✅ Diagnóstico completado"