-- 1. Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS proyecto_escolar;
USE proyecto_escolar;

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,           -- Hash bcrypt (más largo)
    salt VARCHAR(64) NOT NULL,                   -- Salt para derivar clave AES
    clave_publica TEXT,                          -- Clave pública RSA (PEM)
    clave_privada_cifrada TEXT,                  -- Clave privada RSA cifrada con AES
    fecha_registro DATE DEFAULT (CURRENT_DATE)
);

-- 3. Tabla de Tarjetas (con cifrado y firma digital)
CREATE TABLE tarjetas (
    id_tarjeta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    
    -- Campos cifrados (BLOB para datos binarios)
    numero_tarjeta BLOB NOT NULL,                -- JSON cifrado con AES (número, ccv, etc.)
    ccv BLOB,                                    -- Ya no se usa (datos en numero_tarjeta)
    iv BLOB NOT NULL,                            -- Vector de inicialización para AES
    
    -- Fecha en texto plano (para consultas)
    fecha_expiracion DATE NOT NULL,
    
    -- Firma digital
    firma TEXT,                                  -- Firma RSA en base64
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relación con usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_tarjetas_usuario ON tarjetas(id_usuario);
CREATE INDEX idx_usuarios_correo ON usuarios(correo);