# 🔄 Actualizar pnpm en el VPS

## Pasos para actualizar pnpm

### Opción 1: Usando pnpm (Recomendado)

```bash
# Conectarse al VPS
ssh root@72.60.228.9

# Actualizar pnpm
pnpm add -g pnpm

# Verificar la versión
pnpm --version
```

### Opción 2: Usando npm

```bash
# Conectarse al VPS
ssh root@72.60.228.9

# Actualizar pnpm usando npm
npm install -g pnpm@latest

# Verificar la versión
pnpm --version
```

### Opción 3: Usando corepack (si está disponible)

```bash
# Conectarse al VPS
ssh root@72.60.228.9

# Habilitar corepack
corepack enable

# Actualizar pnpm
corepack prepare pnpm@latest --activate

# Verificar la versión
pnpm --version
```

## ⚠️ Nota

El mensaje es solo informativo. Tu versión actual (10.24.0) funciona perfectamente. Puedes actualizar cuando quieras, no es urgente.

## Después de actualizar

No necesitas reiniciar la aplicación, pero si quieres estar seguro:

```bash
pm2 restart starfilters-app
```

