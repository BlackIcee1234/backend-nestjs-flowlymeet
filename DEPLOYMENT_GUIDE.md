# Guía de Despliegue de NestJS en Vercel

## 1. Problemas Comunes y Soluciones

### Problema 1: 404 Not Found
**Síntomas:**
- El deploy se completa sin errores
- La aplicación no responde
- Error 404 al acceder a cualquier ruta

**Posibles soluciones:**
1. **Configuración de rutas en vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/"
       }
     ]
   }
   ```

2. **Configuración de punto de entrada**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/main.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/main.js"
       }
     ]
   }
   ```

### Problema 2: Error en el Build
**Síntomas:**
- El proceso de build falla
- Errores relacionados con TypeScript o dependencias

**Soluciones:**
1. **Configuración de scripts en package.json**
   ```json
   {
     "scripts": {
       "build": "nest build && prisma generate",
       "start": "node dist/main.js",
       "vercel-build": "npm run build"
     }
   }
   ```

2. **Configuración de TypeScript**
   - Asegurarse que `tsconfig.json` esté configurado correctamente
   - Verificar que `outDir` apunte a `dist`

## 2. Configuraciones Alternativas

### Opción 1: Usar Serverless Functions
```json
{
  "version": 2,
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

### Opción 2: Configuración con Express
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter()
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

## 3. Consideraciones Importantes

### Variables de Entorno
Asegurarse de configurar todas las variables necesarias en Vercel:
- PORT
- DATABASE_URL
- JWT_SECRET
- NODE_ENV=production

### CORS
```typescript
app.enableCors({
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

### Logging
Implementar logging robusto para debugging:
```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

## 4. Soluciones de la Comunidad

### Solución 1: Usar @vercel/node
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ]
}
```

### Solución 2: Configuración con Prisma
```json
{
  "version": 2,
  "buildCommand": "npm run build && prisma generate",
  "installCommand": "npm install",
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ]
}
```

## 5. Pasos de Verificación

1. **Verificar el Build**
   ```bash
   npm run build
   ls dist/
   ```

2. **Verificar Variables de Entorno**
   ```bash
   vercel env ls
   ```

3. **Verificar Logs**
   ```bash
   vercel logs
   ```

## 6. Recursos Adicionales

- [Documentación Oficial de Vercel](https://vercel.com/docs)
- [NestJS Deployment Guide](https://docs.nestjs.com/recipes/deployment)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)

## 7. Solución Recomendada

Basado en la investigación y casos de éxito, la configuración más robusta sería:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

Con el siguiente `main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

Y en `package.json`:
```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js"
  }
}
```

## 8. Pasos para Implementar la Solución

1. Limpiar la caché de Vercel
2. Actualizar la configuración
3. Hacer un nuevo deploy
4. Verificar los logs
5. Probar las rutas principales

## 9. Monitoreo y Debugging

1. Usar los logs de Vercel para identificar problemas
2. Implementar health checks
3. Configurar alertas para errores
4. Monitorear el rendimiento

## 10. Consideraciones de Seguridad

1. No exponer variables sensibles
2. Implementar rate limiting
3. Configurar CORS correctamente
4. Usar HTTPS
5. Implementar autenticación y autorización 