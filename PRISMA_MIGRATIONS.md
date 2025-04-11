# Guía de Migraciones con Prisma

Esta guía contiene todos los comandos necesarios para trabajar con migraciones en Prisma, tanto en desarrollo como en producción.

## Comandos Básicos de Migración

### Crear una Nueva Migración

```bash
# Crear una nueva migración después de cambios en schema.prisma
npx prisma migrate dev --name nombre_de_la_migracion

# Ejemplo:
npx prisma migrate dev --name add_user_profile
```

Este comando:
- Detecta los cambios en tu schema.prisma
- Crea un nuevo archivo de migración
- Aplica la migración a tu base de datos
- Regenera el Prisma Client

### Desplegar Migraciones a Producción

```bash
# Desplegar todas las migraciones pendientes
npx prisma migrate deploy

# Ver el estado de las migraciones
npx prisma migrate status
```

## Comandos de Reset y Manejo de Base de Datos

```bash
# Resetear la base de datos (¡CUIDADO! Borra todos los datos)
npx prisma migrate reset

# Resetear forzadamente (sin confirmación)
npx prisma migrate reset --force

# Validar el schema de Prisma
npx prisma validate

# Formatear el schema de Prisma
npx prisma format
```

## Flujo de Trabajo Recomendado

1. **Desarrollo Local**:
   ```bash
   # 1. Modifica tu schema.prisma
   # 2. Crea una nueva migración
   npx prisma migrate dev --name descripcion_del_cambio
   ```

2. **Preparación para Producción**:
   ```bash
   # 1. Verifica el estado de las migraciones
   npx prisma migrate status
   
   # 2. Prueba las migraciones en un ambiente de staging
   npx prisma migrate deploy
   ```

3. **Despliegue a Producción**:
   ```bash
   # Despliega las migraciones
   npx prisma migrate deploy
   ```

## Comandos para Situaciones Específicas

### Manejo de Squash (Combinar Migraciones)

```bash
# Combinar múltiples migraciones en una sola
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > squashed_migration.sql
```

### Manejo de Errores Comunes

```bash
# Si una migración falla, puedes repararla
npx prisma migrate reset --force

# Regenerar Prisma Client después de cambios
npx prisma generate
```

## Comandos de Introspección y Base de Datos

```bash
# Introspección de base de datos existente
npx prisma db pull

# Empujar el schema a la base de datos (¡CUIDADO! Puede causar pérdida de datos)
npx prisma db push

# Ver la GUI de Prisma Studio
npx prisma studio
```

## Mejores Prácticas

1. **Antes de Crear una Migración**:
   - Verifica tu schema.prisma
   - Haz una copia de seguridad si es necesario
   - Prueba los cambios en un ambiente de desarrollo

2. **Al Crear Migraciones**:
   - Usa nombres descriptivos
   - Una migración por cambio lógico
   - Incluye comentarios en SQL cuando sea necesario

3. **Antes de Desplegar a Producción**:
   - Prueba en staging
   - Verifica el estado de las migraciones
   - Ten un plan de rollback

## Comandos de Mantenimiento

```bash
# Limpiar la caché de Prisma
npx prisma generate --force

# Verificar la conexión a la base de datos
npx prisma db seed

# Actualizar Prisma CLI
npm install @prisma/cli@latest
```

## Variables de Entorno

Asegúrate de tener configuradas las variables de entorno correctamente:

```env
# .env para desarrollo
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_db"

# .env.production para producción
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/nombre_db"
```

## Solución de Problemas Comunes

1. **Error de Conexión**:
   ```bash
   # Verificar la conexión
   npx prisma db pull
   ```

2. **Migraciones en Conflicto**:
   ```bash
   # Resetear el estado de las migraciones
   npx prisma migrate reset --force
   ```

3. **Problemas de Shadow Database**:
   ```bash
   # Forzar la recreación de la shadow database
   npx prisma migrate dev --name fix_shadow_db
   ```

## Notas Importantes

- Siempre haz backup antes de migraciones importantes
- Prueba las migraciones en desarrollo antes de producción
- Mantén un registro de las migraciones aplicadas
- Usa nombres descriptivos para las migraciones
- Considera el impacto en los datos existentes

## Recursos Adicionales

- [Documentación oficial de Prisma](https://www.prisma.io/docs/)
- [Guía de migraciones](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Referencia de CLI](https://www.prisma.io/docs/reference/api-reference/command-reference) 