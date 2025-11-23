-- 1. Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS proyecto_escolar;
USE proyecto_escolar;

-- 2. Tabla de Usuarios
-- Aquí guardaremos la información para el Login
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,  -- El correo no se puede repetir
    contrasena VARCHAR(50) NOT NULL,      -- En práctica escolar se suele usar texto simple
    fecha_registro DATE DEFAULT (CURRENT_DATE)
);

-- 3. Tabla de Tarjetas
-- Relacionada con el usuario mediante 'id_usuario'
CREATE TABLE tarjetas (
    id_tarjeta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,              -- Llave foránea (FK)
    numero_tarjeta VARCHAR(16) NOT NULL,  -- VARCHAR es mejor que INT para números largos
    ccv VARCHAR(4) NOT NULL,              -- Código de seguridad (3 o 4 dígitos)
    fecha_expiracion DATE NOT NULL,       -- Formato YYYY-MM-DD (ej: 2028-12-01)
    
    -- Definimos la relación: Una tarjeta pertenece a un usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE -- Si borras al usuario, se borran sus tarjetas automáticamente
);

