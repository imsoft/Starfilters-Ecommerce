# Guía: Actualizar pnpm en el VPS

Esta guía te ayudará a actualizar pnpm de la versión 10.26.0 a 10.28.0 (o cualquier versión más reciente) en tu VPS.

## 🚀 Método Rápido (Recomendado)

### Opción 1: Usando el comando de pnpm (Más fácil)

```bash
# Conectarse al VPS
ssh root@tu-servidor-ip

# Actualizar pnpm globalmente
pnpm add -g pnpm

# Verificar la nueva versión
pnpm --version
```

**Debería mostrar:** `10.28.0` o superior

### Opción 2: Usando npm

```bash
# Conectarse al VPS
ssh root@tu-servidor-ip

# Actualizar pnpm usando npm
npm install -g pnpm@latest

# Verificar la nueva versión
pnpm --version
```

### Opción 3: Usando Corepack (Método oficial de Node.js)

```bash
# Conectarse al VPS
ssh root@tu-servidor-ip

# Habilitar corepack (si no está habilitado)
corepack enable

# Actualizar pnpm
corepack prepare pnpm@latest --activate

# Verificar la nueva versión
pnpm --version
```

## ✅ Verificación

Después de actualizar, verifica que todo funciona:

```bash
# Ver versión de pnpm
pnpm --version

# Verificar que pnpm funciona correctamente
cd ~/starfilters-app
pnpm --version
```

## 🔧 Si hay problemas

### Error: "Command not found" después de actualizar

```bash
# Verificar dónde está instalado pnpm
which pnpm

# Si no aparece, puede que necesites actualizar el PATH
# O reinstalar pnpm
npm install -g pnpm@latest
```

### Error: "Permission denied"

Si usas un usuario no-root:

```bash
# Usar sudo
sudo pnpm add -g pnpm

# O con npm
sudo npm install -g pnpm@latest
```

### Verificar que la actualización fue exitosa

```bash
# Ver versión actual
pnpm --version

# Debe mostrar 10.28.0 o superior
```

## 📝 Notas

- La actualización de pnpm no afecta los proyectos existentes
- No es necesario reconstruir el proyecto después de actualizar pnpm
- Si tienes problemas, puedes volver a la versión anterior con: `npm install -g pnpm@10.26.0`
