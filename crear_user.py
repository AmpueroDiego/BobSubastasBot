import psycopg2
import getpass
from datetime import datetime
import os
from dotenv import load_dotenv

def crear_negocio():
    """
    Script para crear un nuevo negocio con login y horarios predeterminados
    """
    
    # Cargar variables de entorno
    load_dotenv()
    
    print("=" * 50)
    print("CREACIÓN DE NUEVO NEGOCIO")
    print("=" * 50)
    
    # Solicitar datos del negocio
    nombre_negocio = input("\nNombre del negocio: ").strip()
    path = input("Path del negocio (URL amigable): ").strip()
    correo = input("Correo electrónico: ").strip()
    contrasena = getpass.getpass("Contraseña: ")
    
    # Datos opcionales
    webhook = input("Webhook (opcional, presiona Enter para omitir): ").strip() or None
    numero = input("Número de WhatsApp (opcional, presiona Enter para omitir): ").strip() or None
    numero_admin = input("Número admin (opcional, presiona Enter para omitir): ").strip() or None
    
    # Confirmar datos
    print("\n" + "=" * 50)
    print("CONFIRMAR DATOS:")
    print("=" * 50)
    print(f"Nombre del negocio: {nombre_negocio}")
    print(f"Path: {path}")
    print(f"Correo: {correo}")
    print(f"Contraseña: {'*' * len(contrasena)}")
    print(f"Webhook: {webhook or 'No especificado'}")
    print(f"Número: {numero or 'No especificado'}")
    print(f"Número admin: {numero_admin or 'No especificado'}")
    print("=" * 50)
    
    confirmar = input("\n¿Deseas continuar? (s/n): ").lower()
    
    if confirmar != 's':
        print("Operación cancelada.")
        return
    
    # Obtener credenciales desde .env
    db_host = os.getenv('POSTGRES_HOST')
    db_port = os.getenv('POSTGRES_PORT')
    db_name = os.getenv('POSTGRES_DATABASE')
    db_user = os.getenv('POSTGRES_USER')
    db_password = os.getenv('POSTGRES_PASSWORD')
    db_sslmode = os.getenv('DB_SSLMODE', 'require')
    
    # Verificar que se cargaron las variables
    if not all([db_host, db_port, db_name, db_user, db_password]):
        print("\n❌ Error: No se pudieron cargar las credenciales desde el archivo .env")
        print("Asegúrate de que el archivo .env existe y contiene todas las variables necesarias.")
        return
    
    print("\n" + "=" * 50)
    print("Conectando a la base de datos...")
    print(f"Host: {db_host}")
    print(f"Base de datos: {db_name}")
    print("=" * 50)
    
    conn = None
    cursor = None
    
    try:
        # Conectar a la base de datos con SSL
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password,
            sslmode=db_sslmode
        )
        
        cursor = conn.cursor()
        
        print("✓ Conexión exitosa")
        print("\nCreando negocio...")
        
        # 1. Insertar negocio
        cursor.execute("""
            INSERT INTO negocio (path, nombre_negocio, webhook, numero, numero_admin, logo_imagen)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (path, nombre_negocio, webhook, numero, numero_admin, '/logo-default.png'))
        
        negocio_id = cursor.fetchone()[0]
        print(f"✓ Negocio creado con ID: {negocio_id}")
        
        # 2. Insertar login
        cursor.execute("""
            INSERT INTO login (correo, contrasena, id_negocio, primera_vez_conectado)
            VALUES (%s, %s, %s, %s);
        """, (correo, contrasena, negocio_id, datetime.now()))
        
        print("✓ Login creado")
        
        # 3. Insertar horarios predeterminados
        dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        for dia in dias:
            cursor.execute("""
                INSERT INTO horarios (dia, hora_inicio, hora_final, activo, id_negocio)
                VALUES (%s, %s, %s, %s, %s);
            """, (dia, '11:00:00', '21:00:00', True, negocio_id))
        
        print("✓ Horarios creados (11:00 - 21:00, todos los días)")
        
        # Confirmar transacción
        conn.commit()
        
        print("\n" + "=" * 50)
        print("¡NEGOCIO CREADO EXITOSAMENTE!")
        print("=" * 50)
        print(f"ID del negocio: {negocio_id}")
        print(f"Nombre: {nombre_negocio}")
        print(f"Path: {path}")
        print(f"Correo: {correo}")
        print("=" * 50)
        
    except psycopg2.Error as e:
        print(f"\n❌ Error en la base de datos: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\nConexión cerrada.")

if __name__ == "__main__":
    try:
        crear_negocio()
    except KeyboardInterrupt:
        print("\n\nOperación cancelada por el usuario.")
    except Exception as e:
        print(f"\n❌ Error: {e}")